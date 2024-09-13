<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>

<%@ include file="../layout/header.jsp"%>

<div class="container">
	<h1>여행계획</h1>
		<div class="d-flex justify-content-around">
			<div id="left-section" class="col-sm-8">
				<div class="input-group-prepend">
					<span class="input-group-text mb-2">목적지</span> <input type="text" id="stage_add" placeholder="목적지 장소를 입력해주세요" class="form-control">
				</div>
				<textarea class="form-control" id="result" rows="15"></textarea>
	<div class="text-right mt-2">
		<button type="button" id="btn-plan-save" class="btn btn-dark">저장</button>
	</div>

</div>

<div id="right-section"  class="col-sm-4">
	<div class="chatbot-container">
		<div id="chatbot">
			<div id="chatbot-messages">
				<!-- 서버에서 받은 응답을 여기에 넣을 예정 -->
				<p id="chatbot-response">챗봇: 여행 계획을 도와드릴게요!</p>
			</div>
			<div class="input-group mt-3">
				<input type="text" id="chatbot-input" class="form-control" placeholder="메시지를 입력하세요">
				<div class="input-group-append">
					<button class="btn btn-dark" id="btn-write">보내기</button>
				</div>
			</div>
		</div>
	</div>
</div>
</div>
</div>

<script src="/js/user.js"></script>
<%@ include file="../layout/footer.jsp"%>

<style>
#chatbot-messages {
	border: 1px solid #ccc;
	padding: 10px;
	height: 50vh;
	overflow-y: scroll;
}
</style>