let gvQueList = []
let gvQueSuffle // 문제 섞겠는냐
let gvMulSuffle // 보기 섞겠느냐
let gvViewMode  // 보기보드 1공부모드 2시험모드
let gvMarkDownTF = true // 마크다운 컨버트?
let gvClass = ""

var converter;
let gvIndex = 0

$( document ).ready(function() {
    // 문제 순서 섞기
    $("#chkQueSuffle").change( () => reload() )

    // 과목선택
    $("#selClass").change( () => fnSelClass() )

    // 문제이동
    $("#selQue").change( () => fnSelQue() )

    // 보기 순서 섞기
    $("#chkMulSuffle").change( () => {
        if ($("#chkMulSuffle").prop("checked") ) gvQueList[fnIndex()].v1 = undefined // 섞기를 누르면 섞을수 있게 초기화
        reload()
    } )

    // 모드 선택. 공부모드,시험모드
    $("input[name='chkMode']").click( () => {
        fnAlert('공부모드 <i class="bi bi-arrow-right"></i> 문제와 답이 같이 표시됩니다.<br>시험모드 <i class="bi bi-arrow-right"></i> 문제를 푼 후 답이 표시됩니다.')
        gvViewMode = $('input[name="chkMode"]:checked').val()
    })

    gvQueSuffle = $("#chkQueSuffle").prop("checked")? true:false // 문제 섞겠는냐
    gvMulSuffle = $("#chkMulSuffle").prop("checked")? true:false // 보기 섞겠느냐
    gvViewMode  = $('input[name="chkMode"]:checked').val(); // 공부모드 시험모드
});

function fnSelClass() {
    let vClass = $("#selClass").val()
    if ( vClass == undefined || vClass == "" ) return

    let vUrl = "./moon/" + vClass + "/data.js"
    $.getScript(vUrl, function(data, textStatus, jqxhr) {
        console.log('Load was performed.');
        gvClass = vClass
        fnInit()
    })
}

// 시작
function fnInit() {
    gvIndex = 0
    reload()
}

function reload() {
    gvQueSuffle = $("#chkQueSuffle").prop("checked")? true:false // 문제 섞겠는냐
    gvMulSuffle = $("#chkMulSuffle").prop("checked")? true:false // 보기 섞겠느냐
    gvViewMode  = $('input[name="chkMode"]:checked').val();

    fnMoonLoad() // 문제 로드
    fnSetQ() // 문제1번 화면에 그리기
}

function fnIndex(pIndex) {
    if ( pIndex == undefined ) return gvIndex
    if ( pIndex == gvIndex   ) return gvIndex

    gvIndex = pIndex
    fnCookie.set("nenwa_index_" + gvClass, gvIndex)

    $("#selQue").val(gvIndex)
    fnSetProgress() // 프로그레스바 그리기

    return gvIndex
}
fnIndexAdd   = (pIndex) => fnIndex(0 + gvIndex + ( ( pIndex == undefined )? 1:pIndex) )
fnIndexMinus = (pIndex) => fnIndex(0 + gvIndex - ( ( pIndex == undefined )? 1:pIndex) )

// 프로그레스바 그리기
function fnSetProgress() {
    let vPer = fnIndex() / gvQueList.length * 100
    let vMent = (fnIndex() + 1) + " / " + (gvQueList.length)
    $("#prg_que").attr("aria-valuenow", fnIndex()).css("width", vPer + "%").text(vMent)
}

// 쿠키처리
fnCookie = {
    set : function(key, value, expiredays) {
        let todayDate = new Date();
        if ( expiredays == undefined || expiredays == "" ) expiredays = 30
        todayDate.setDate(todayDate.getDate() + expiredays); // 현재 시각 + 일 단위로 쿠키 만료 날짜 변경
        document.cookie = key + "=" + escape(value) + "; path=/; expires=" + todayDate.toGMTString() + ";";
    },
    get : function(key) {
    	key = new RegExp(key + '=([^;]*)'); // 쿠키들을 세미콘론으로 구분하는 정규표현식 정의
    	return key.test(document.cookie) ? unescape(RegExp.$1) : ''; // 인자로 받은 키에 해당하는 키가 있으면 값을 반환
    },
    del : function(key) {
        //쿠키 삭제
        //쿠키는 삭제가 없어서 현재 시각으로 만료 처리를 함.
        let todayDate = new Date();
        document.cookie = key + "=; path=/; expires=" + todayDate.toGMTString() + ";" // 현재 시각 이전이면 쿠키가 만료되어 사라짐.
    },
}

function fnMoonLoad() {
    let vStr = ""
    gvQueList = []
    for ( let i = 0; i < gvMoon.l.length; i++ ) {
        gvQueList.push(gvMoon.l[i])
        vStr += "<option value=" + i + ">" + (i+1) + ((gvMoon.l[i].k == undefined)? "" : " - " + gvMoon.l[i].k) + "</option>" // 문제 SelectBox 만들기
    }
    $("#selQue").html(vStr)
    fnSetProgress()

    // 쿠키. 이전 저장번호 로드
    let vIndex = 0 + Number(fnCookie.get("nenwa_index_" + gvClass))
    if ( vIndex == "" ) vIndex = 0
    if ( vIndex >= gvQueList.length ) vIndex = 0
    fnIndex(vIndex)
    $("#selQue").val(vIndex)

    /*
    gvQueList[배열]
    m(필수) 문제
    v(필수, 주관식일때는 빈값) [배열] 보기
    d(필수) [배열] 답
    h(선택) 해설
    */
    // 문제 섞을거냐
    if ( gvQueSuffle ) gvQueList = shuffleArray(gvQueList);
}

function fnSelQue(that) {
    fnIndex(Number($("#selQue").val()))
    fnSetQ()
}

// 문제 그린 후 답 체크
function fnSetMyAnswers() {
    let vMyAnswer = gvQueList[fnIndex()].myAnswers // 내가 선택한 답
    if ( vMyAnswer == undefined || vMyAnswer.length == 0 ) return

    if ( isMuliple() ) { // 객관식
        for ( let i = 0; i < vMyAnswer.length; i++ ) {
            $('#chkQue'+ (vMyAnswer[i]-1)).prop("checked", true)
        }
    } else { // 주관식
        $('#txtAnswer').val(vMyAnswer)
    }
}

// 작성한 정답을 gvQueList[fnIndex()].myAnswers 에 저장
function getMyAnswers() {
    fnSaveMyAnswers()
    return gvQueList[fnIndex()].myAnswers
}

function fnSaveMyAnswers() {
    let vDap = []
    if ( isMuliple() ) { // 객관식
        for ( let i = 0; i < gvQueList[fnIndex()].v1.length; i++ ) {
            if ( $('#chkQue'+ i).is(':checked') ) vDap.push(i+1)
        }
    } else { // 주관식
        vDap.push($('#txtAnswer').val().trim())
    }
    gvQueList[fnIndex()].myAnswers = vDap.sort()
}

// 객관식이면 return true 주관식은 false
isMuliple = () => !( gvQueList[fnIndex()].v.length == 0 )

// 정답인가?
function isCorrect() {
    let answer = getMyAnswers()
    let answer2 = gvQueList[fnIndex()].di
    return ( answer.sort().toString() == answer2.sort().toString() )
}

function fnQue(vParam) {
    fnSaveMyAnswers()
    if ( vParam == "N" ) {
        if ( !$("#div_d").is(":visible")  ) { // 답이 닫혀있으면 답열기
            fnOpenDap()
            return
        }
        if ( fnIndex() + 1 >= gvQueList.length ) {
            // 종?
            return
        }
        fnIndexAdd()
        fnSetQ()
    } else if ( vParam == "P" ) {
        if ( fnIndex() <= 0 ) {
            // 초?
            return
        }
        fnIndexMinus()
        fnSetQ()
    } else if ( vParam == "R" ) {
        // 스크립트 새로 읽기
        reload()
    }
}

// 답을 열어
function fnOpenDap() {
    getMyAnswers() // 답 저장
    let vCorrect = isCorrect() // 정답이면 true

    // 정답에 따라 색칠
    if ( vCorrect ) {
        $("#div_dapgrouptab").removeClass("alert-danger").addClass("alert-success")
        //$("#div_d").removeClass("is-invalid").addClass("is-valid")
    } else {
        $("#div_dapgrouptab").removeClass("alert-success").addClass("alert-danger")
        //$("#div_d").removeClass("is-valid").addClass("is-invalid")
    }

    // 답 그룹 오픈
    $("#div_dapgroup").show()

    if ( isMuliple() ) {
        // 객관식
        let vMultiple  = gvQueList[fnIndex()].v1
        // 선택한것을 붉은색. 추후 정답을 초록색으로 덧칠함. 한번에 할수있는게 있을텐데
        for ( let i = 0; i < vMultiple.length; i++ ) {
            if ( $('#chkQue'+ i).is(':checked') ) {
                $("#divFormControl" + i ).removeClass("form-control-plaintext").addClass("form-control is-invalid")
            }
        }

        // 정답을 초록색
        let vFinAnswers = gvQueList[fnIndex()].di
        for ( let i = 0; i < vFinAnswers.length; i++ ) {
            let k = vFinAnswers[i] - 1
            // 답을 굵게
            $("#chkQueText" + k ).css('font-weight', 'bold')
            //$("#liQue" + k ).removeClass("list-group-item-danger").addClass("list-group-item-success")
            $("#divFormControl" + k ).removeClass("form-control-plaintext is-invalid").addClass("form-control is-valid")
        }
    } else { // 주관식
        $('#txtAnswer').addClass(vCorrect?"is-valid":"is-invalid")
        $('#txtAnswer').attr("readonly", "readonly")
    }
}

// 문제 그리기
function fnSetQ() {
    $('html').scrollTop(0);
    let vQue = gvQueList[fnIndex()]

    // 문제 가공 전이라면 가공
    if ( vQue.v1 == undefined ) fnMakeMultiple() // 문제 가공

    let n = fnIndex() + 1 // 문제번호
    let m1 = vQue.m1 // 문제 가공
    let v1 = vQue.v1 // 보기 가공
    let d1 = vQue.d1 // 답 가공 텍스트
    let di = vQue.di // 답 가공 인덱스
    let h1 = vQue.h1 // 해설 가공
    let sd = vQue.myAnswers // sd [배열] 선택한 답

    let k1 = vQue.k1 // 상세 과목

    $("#div_k").html(k1) // 과목
    $("#div_m").html(m1) // 문제
    $("#div_v").html(fnVText()) // 보기 가공
    $("#div_d").html(d1) // 답
    $("#div_h").html(h1) // 해설

    fnSetMyAnswers() // 내가 저장한 답 그리기

    if ( gvViewMode == "1" ) { // 공부모드 => 답이 바로 오픈된다.
        fnOpenDap()

    }  if ( gvViewMode == "2" ) { // 시험모드 => 문제를 풀고 답을본다.
         $("#div_dapgroup").hide() // 답, 해설부분 가리기
    }

    $("table").addClass("table table-bordered")
}

// 보기 가공
function fnMakeMultiple() {
    let vIndex = fnIndex()
    // [필수]
    let m = gvQueList[vIndex].m // 문제
    let v = gvQueList[vIndex].v // [배열] 보기
    let d = gvQueList[vIndex].d // [배열] 답
    let h = gvQueList[vIndex].h // 해설
    // [선택]
    let k = gvQueList[vIndex].k // 상세과목명

    if ( d == undefined ) d = [""]
    m = fnMakeM(m) //TODO 임시 문제 가공

    let m1 = m // 문제 가공
    let v1 = [] // 보기 가공
    let d1 = [] // 답 가공 텍스트
    let di = [] // 답 가공 인덱스
    let h1 = h // 해설 가공

    if ( v == undefined || v.length == 0 ) { // 보기가 없으면 주관식
        d1 = d
        di = [d1.join(",")]
    } else {
        // 객관식
        // 보기 가공 시작
        let vShuffleMap = []
        for ( let i = 0; i < v.length; i++ ) {
            vShuffleMap.push(i)
            v1.push("")
        }

        // 보기 섞기 옵션
        if ( gvMulSuffle ) vShuffleMap = shuffleArray(vShuffleMap)

        for ( let i = 0; i < vShuffleMap.length; i++ ) {
            let vReOrg = "__" + (i + 1) + "__"
            let vReStr = fnConvVNum(vShuffleMap[i] + 1)

            // 1. 해설의 보기번호 변경
            h1 = h1.replace(vReOrg, vReStr) // 해설의 __1__,__2__... 바꾼다.

            // 2. 답 변경
            for ( let j = 0; j < d.length; j++ ) {
                if ( d[j] == (i + 1) ) di.push(vShuffleMap[i] + 1) // 답
                if ( d[j] == (i + 1) ) d1.push(fnConvVNum(vShuffleMap[i] + 1)) // 답 텍스트
            }

            // 3. 보기 변경
            v1[vShuffleMap[i]] = v[i]
            //v1[vShuffleMap[i]] = v1[vShuffleMap[i]].replace("__" + (i + 1) + "__ ", "") // TODO 임시
            v1[vShuffleMap[i]] = fnConvVNum(vShuffleMap[i]+1) + " " + v1[vShuffleMap[i]]

        }
        d1 = d1.sort()
    }
    d1 = d1.join(",")

    for ( let i = 0; i < v1.length; i++ ) { v1[i] = fnMarkDown(v1[i]) } // 보기[배열]를 마크다운으로 변환
    for ( let i = 0; i < d1.length; i++ ) { d1[i] = fnMarkDown(d1[i]) } // 답[배열]을 마크다운으로 변환
    gvQueList[vIndex].m1 = fnMarkDown((vIndex + 1) + ". " + m1)
    gvQueList[vIndex].v1 = v1
    gvQueList[vIndex].di = di // 답 인덱스
    gvQueList[vIndex].d1 = fnMarkDown("🌟 " + d1) // 답 markdown
    //gvQueList[vIndex].d1 = fnMarkDown("<i class='bi bi-check-lg'></i> " + d1) // 답 markdown
    gvQueList[vIndex].h1 = fnMarkDown(h1)
    gvQueList[vIndex].k1 = ( k == undefined )? "": "<span class='badge bg-secondary'>" + k + "</span>"
}

// 보기를 html로 변환
function fnVText() {
    let vIndex = fnIndex()
    let vShuffleV = gvQueList[vIndex].v1
    let type = ( gvQueList[vIndex].di.length == 1 )? "radio" : "checkbox" // 답이 1개면 라디오 그이상이면 체크
    let vRtn = ""

    if ( vShuffleV.length == 0 ) { // 보기가 없으면 주관식
        vRtn += "<input class='form-control form-control-lg' type='text' id='txtAnswer'>"
    } else {
        //vRtn += "<ul class='list-group list-group-flush'>"
        for ( let i = 0; i < vShuffleV.length; i++ ) {
            let vv =
            //"<li class='list-group-item' id='liQue" + i + "'>"+
            "<div class='form-check form-control-plaintext' id='divFormControl" + i + "'>" +
            "  <input class='form-check-input' type='" + type + "' name='chkQue' id='chkQue" + i + "'>" +
            "  <label class='form-check-label' for='chkQue" + i + "' id='chkQueText" + i + "'>" +  vShuffleV[i] +
            "  </label>" +
            "</div>"//+ "</li>"
            vRtn += vv
        }
        //vRtn += "</ul>"
    }
    return vRtn
}

// 숫자를 원숫자로 변경
let gvOneNum = ["①","②","③","④","⑤","⑥","⑦","⑧","⑨","⑩","⑪","⑫","⑬","⑭","⑮"]
fnConvVNum = (n) => ( n > 15 )? "(" + n + ")" : gvOneNum[n-1]

let gvStrongStr = ["아닌","먼","모두","틀린","부적합한","부적절한"]
function fnMakeM(m) {
    // 임시로 문제 앞에 적은 항번 삭제
    let k = m.substr(0, m.indexOf(" "))
    k = k.replace(".","").replace("]","").replace(")","")
    if ( $.isNumeric(k) ) {
        m = m.substr(m.indexOf(" "))
    }

    // 강조단어 처리
    for ( let i = 0; i < gvStrongStr.length; i++ ) {
        m = m.replace(" " + gvStrongStr[i] + " "," <u>**" + gvStrongStr[i] + "**</u> ")
    }
    m = fnMarkDown(m) // 마크다운 변환
    return m
}

// 화면 글자 크기 조절
let gvSeemSize = 1, gvZoomSize = 1
function fnZoom(p) {
    if ( p == "I" ) {
        gvSeemSize += 0.05;
        gvZoomSize *= 1.2;
    } else if ( p == "O" ) {
        gvSeemSize -= 0.05;
        gvZoomSize /= 1.2;
    } else {
        return
    }

    let browser = navigator.userAgent.toLowerCase();
    if ( browser.indexOf("firefox") != -1 ) { //브라우저가 firefox일때
        document.body.style.webkitTransform = 'scale(' + gvSeemSize + ')';
        document.body.style.webkitTransformOrigin = '50% 0 0'; //늘리고 줄였을때위치,
        document.body.style.msTransform = 'scale(' + gvSeemSize + ')';
        document.body.style.msTransformOrigin = '50% 0 0';
        document.body.style.transform = 'scale(' + gvSeemSize + ')';
        document.body.style.transformOrigin='50% 0 0';
        document.body.style.OTransform = 'scale(' + gvSeemSize + ')';
        document.body.style.OTransformOrigin='50% 0 0';
    } else {
        document.body.style.zoom = gvZoomSize;
    }
}

function fnAlert(vMsg) {
    $("#vAlertStr").html(vMsg)
    let obj = new bootstrap.Toast($("#liveToast"))
    obj.show()
}

fnMarkDown = pStr => gvMarkDownTF? marked.parse(pStr+"") : pStr
shuffleArray = array => array.sort(() => Math.random() - 0.5)
