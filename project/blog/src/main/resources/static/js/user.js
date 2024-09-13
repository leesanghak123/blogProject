let index = {
	init: function() {
		// btn-save를 찾아서 클릭이 일어나면 save를 호출
		$("#btn-save").on("click", () => { // function(){} 대신 ()=>{}를 사용하는 이유는 this를 바인딩하기 위해서 사용
			this.save();
		});
		$("#btn-update").on("click", () => { 
			this.update();
		});
		$("#btn-write").on("click", () => { 
			this.write();
		});
		$("#btn-plan-save").on("click", () => {
			this.planSave();
		});
		$("#btn-plan-update").on("click", () => {
			this.planUpdate();
		});
		$("#btn-plan-delete").on("click", () => {
			this.planDelete();
		});
	},

	save: function() {
		if (!this.validateUserForm()) {
            return;
        }
		//alert('user의 save함수 호출됨');
		let data = {
			username: $("#username").val(),
			password: $("#password").val(),
			email: $("#email").val()
		};

		//console.log(data);
		
		// ajax 호출 시 default가 비동기 호출
		// ajax 통신을 이용해서 3개의 데이터를 json으로 변경하여 insert 요청
		// ajax가 통신을 성공하고 서버가 json을 리턴해주면 자동으로 자바 오브젝트로 변환해준다 (밑의 dataType:"json" 를 안적어도 된다는 말)
		$.ajax({
			type:"POST", // 회원가입 할거니까 post(insert)
			url:"/auth/joinProc",
			data:JSON.stringify(data), // http body 데이터, 위의 data 자바 오브젝트를 JSON으로 던져줄 것
			contentType:"application/json; charset=utf-8", // 위의 코드와 세트, body데이터가 어떤 타입인지(MIME)
			dataType:"json" // 요청을 서버로해서 응답이 왔을 때 기본적으로 모든 것이 문자열 (생긴게 json이라면) => javascript 오브젝트로 변경
		}).done(function(resp){
			if(resp.status === 500) {	// globalException에서 에러가 나면 500에러로 던져 줌
				alert("회원가입에 실패하였습니다.");
				location.reload();
			}else {
				alert("회원가입이 완료되었습니다.");
				//console.log(resp)
				location.href="/";
			}
			
		}).fail(function(error){
			alert(JSON.stringify(error));
		});

	},
	
	
	update: function() {
		let data = {
			id: $("#id").val(),
			username: $("#username").val(),
			password: $("#password").val(),
			email: $("#email").val()
		};

		$.ajax({
			type:"PUT", 
			url:"/user",
			data:JSON.stringify(data),
			contentType:"application/json; charset=utf-8", 
			dataType:"json"
		}).done(function(resp){
			alert("회원수정이 완료되었습니다.");
			location.href="/";
		}).fail(function(error){
			alert(JSON.stringify(error));
		});

	},

	write: function() {
	    if (!this.validatePlanForm()) {
	        return;
	    }
	    
	    // 사용자가 입력한 메시지 저장
	    let userMessage = $("#chatbot-input").val();
	    // 먼저 사용자 입력 메시지를 화면에 출력
	    $("#chatbot-messages").append(`<p>나: ${userMessage}</p>`);
	    $("#chatbot-input").val('');
	    
	    let data = {
	            message: userMessage  // 여기서 "message"로 맞추어야 합니다.
	    };

	    $.ajax({
	        type: "POST",
	        url: `/api/user/travel/plan`,
	        data: JSON.stringify(data),
	        contentType: "application/json; charset=utf-8",
	        dataType: "json"
	    }).done(function(resp) {
	        if (resp.status === 500) {
	            alert("작성에 실패하였습니다.");
	        } else {
	         // 서버 응답을 챗봇 메시지 창에 추가
	            $("#chatbot-messages").append(`<p>챗봇: ${resp.data.response}</p>`);
	            // 메시지 창을 항상 최신 메시지에 스크롤
	            $("#chatbot-messages").scrollTop($("#chatbot-messages")[0].scrollHeight);
	        }
	        console.log(resp);
	    }).fail(function(error) {
	        alert(JSON.stringify(error));
	        console.error(error);
	    });
	},

	
	planSave: function() {
	    alert('계획저장이 완료되었습니다.');
	    let data = {
	    	stage: $("#stage_add").val(),
	    	result: $("#result").val()
	    };

	        $.ajax({
	            type: "POST",
	            url: `/api/user/travel/save`,
	            data: JSON.stringify(data),
	            contentType: "application/json; charset=utf-8",
	            dataType: "json"
	        }).done(function(resp) {
	            console.log(resp);
	            location.href="/";
	        }).fail(function(error) {
	            alert(JSON.stringify(error));
	            console.error(error);
	        });
	},
	
	planUpdate: function() {
		let data = {
			id: $("#id").val(),
			result: $("#content").val()
		};

		$.ajax({
			type:"PUT",
			url:`/api/user/planUpdate/${data.id}`,
			data:JSON.stringify(data),
			contentType:"application/json; charset=utf-8", // 위의 코드와 세트, body데이터가 어떤 타입인지(MIME)
			dataType:"json" // 요청을 서버로해서 응답이 왔을 때 기본적으로 모든 것이 문자열 (생긴게 json이라면) => javascript 오브젝트로 변경
		}).done(function(resp){
			alert("글 수정이 완료되었습니다.");
			location.href=`/user/planStorageForm`;
		}).fail(function(error){
			alert(JSON.stringify(error));
		});

	},
	
	planDelete: function() {
		let data = {
				id: $("#id").val()
			};
		
		$.ajax({
			type:"DELETE",
			url:`/api/user/${data.id}`,
			dataType:"json" 
		}).done(function(resp){
			alert("게획삭제 성공");
			location.href=`/user/planStorageForm`;
		}).fail(function(error){
			alert(JSON.stringify(error));
		});

	},
	
	// 유효성 검사 -------------------------------------------------------------------------------------------------------------

	validateUserForm: function() {
        let username = $("#username").val();
        let password = $("#password").val();
        let email = $("#email").val();

        if (username === "" || password === "" || email === "") {
            alert("모두 작성해주세요.");
            return false;
        }

        let emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailPattern.test(email)) {
            alert("유효한 이메일 주소를 입력해주세요.");
            return false;
        }

        return true;
    },
	
	validatePlanForm: function() {
        let start = $("#start").val();
        let end = $("#end").val();
        let days = $("#days").val();

        if (start === "" || end === "" || days === "") {
            alert("모두 작성해주세요.");
            return false;
        }

        return true;
    },

}

index.init();