# Q&A chatbot
# 문서 불러들이기 -> 청크 -> 임베딩 -> 벡터 저장소 저장 -> 유사 문장 출력 -> LLM에 질문과 함께 넣어줌
# 랭체인의 다큐먼트 로더로 문서를 불러드릴 예정 (나는 파이썬 코드)
# 청크는 하지 않음
# 임베딩 모델 : 한글에 특화된 모델을 HuggingFace에서 들고 올 것
# 벡터저장소는 Faiss (속도가 빠른 장점) <-> 크로마
# 유사문장출력 -> 랭체인의 리트리버
# LLM은 gpt3.5
import os
from loguru import logger # 행위의 기록을 남기기 위한 log
import pandas as pd
from fastapi import FastAPI, HTTPException # fastApi 사용
from pydantic import BaseModel # 유효성 검사 라이브러리
from langchain.docstore.document import Document
# from langchain.chains import RetrievalQA
from langchain.chains import ConversationalRetrievalChain # 메모리를 가지고 있는 체인
from langchain.memory import ConversationBufferMemory # 메모리에 몇 개까지 넣어줄지
from langchain.chat_models import ChatOpenAI # LLM
from langchain.embeddings import HuggingFaceEmbeddings # 한국어에 특화된 임베딩모델
from langchain.vectorstores import FAISS # 벡터 저장소(임시)
from langchain.callbacks import get_openai_callback # 메모리를 구축을 위한 추가적인 라이브러리
# import tiktoken # 청크 시 나누는 기준(토큰)
from dotenv import load_dotenv
import openai

# .env 파일로부터 환경 변수 로드
load_dotenv()
# 환경 변수에서 OpenAI API 키 읽기
openai_api_key = os.getenv('OPENAI_API_KEY')
# API 키 설정(openai 라이브러리의 api_key 속성에 openai_api_key 값을 할당)
openai.api_key = openai_api_key

# FastAPI 인스턴스 생성(엔드포인트, 요청, 응답 등)
app = FastAPI()

# 문자열 이외의 타입에 대한 유효성 검사
class Query(BaseModel):
    question: str

# 파일 경로 목록 설정
# file_paths = ["숙소.csv", "관광명소.csv", "음식점.csv"]
file_paths = ["test.csv"]

# 문서 리스트 초기화
documents = []

# CSV 파일을 읽어서 문서 객체 리스트 반환하는 함수 정의
def get_text(doc_path):
    doc_list = []
    df = pd.read_csv(doc_path)
    for index, row in df.iterrows(): # 행단위로 읽기
        content = row.to_string(index=False) # 각 행을 문자열로 변환하여 content에 저장
        document = Document(page_content=content, metadata={"source": f"{doc_path} row {index}"}) # 참조문서가 어떤 파일에서 나왔는지 추적(document사용 이유)
        doc_list.append(document)
    return doc_list

# 각 파일 경로에 대해 문서 생성(파일 개수 만큼 document로 만들기)
for file_path in file_paths:
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")
    documents.extend(get_text(file_path))  # get_text 함수 호출

# 문서 리스트를 이용해 벡터 저장소 생성 및 반환하는 함수 정의
def get_vectorstore(documents):
    embeddings = HuggingFaceEmbeddings(
        model_name="jhgan/ko-sroberta-multitask", # 임베딩 모델
        model_kwargs={'device': 'cpu'},
        encode_kwargs={'normalize_embeddings': True} # 사용자의 질문과 비교하기 위해(유사성 비교)
    )
    vectordb = FAISS.from_documents(documents, embeddings) # Faiss 벡터저장소
    return vectordb

# 벡터 저장소 설정
vectordb = get_vectorstore(documents)

# 위에서 선언한 것들을 모두 담음
def get_conversation_chain(vectordb, openai_api_key):
    llm = ChatOpenAI(openai_api_key=openai_api_key, model_name='gpt-3.5-turbo', temperature=0) # temperature가 0이기 때문에 리트리버한 내용으로만 찾음
    conversation_chain = ConversationalRetrievalChain.from_llm(
        llm=llm,
        chain_type="stuff",
        retriever=vectordb.as_retriever(search_type='mmr', search_kwargs={'k':30, 'fetch_k':60}, verbose=True), # mmr은 검색 시 최대한 다양한 청크, 총 60개의 문서를 찾아서 다양하게 30개만 뽑아줘, verbose=True는 체인 내부 수행 정보
	    #memory=ConversationBufferMemory(memory_key='chat_history', return_messages=True, output_key='answer'),
        get_chat_history=lambda h: h, # 메모리가 들어온 그대로 history에 넣기
        return_source_documents=True, # LLM이 참고한 문서 출력
        verbose=True # 체인 묶은거 출력
    )
    return conversation_chain

# 대화 체인 초기화(벡터DB를 통해 답변을 할 수 있게 chain)
conversation = get_conversation_chain(vectordb, openai_api_key)

# 쿼리 엔드포인트 정의
@app.post("/query")
async def query_endpoint(query: Query): # 질의 받기
    logger.info(f"Received query: {query}")
    instruction = "내가 지역을 알려주면 너는 주어진 정보를 바탕으로 여행을 기획하는 여행기획자야."
    modified_question = instruction + query.question
    logger.info(f"Modified question: {modified_question}")
    
    answer = conversation({"question": modified_question, "chat_history": []})
    
    logger.info(f"Conversation result: {answer}")

    response = answer.get('answer', 'No result found')
    source_documents = answer.get('source_documents', [])
    
    return {
        "answer": response,
        "sources": [{"source": doc.metadata['source'], "content": doc.page_content} for doc in source_documents]
    }



# 메인 모듈로 실행할 경우 웹 서버를 시작
if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
