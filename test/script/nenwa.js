let gvIndex = 0
let gvQueList = []
let gvQueSuffle = false // 문제 섞겠는냐
let gvMulSuffle = true // 보기 섞겠느냐

// 시작
function fnInit() {
    fnMoonLoad() // 문제 로드
    fnSetQ() // 문제1번 화면에 그리기
}

function shuffleArray(array) {
    return array.sort(() => Math.random() - 0.5);
}

function fnSelQue(that) {
    gvIndex = Number($(that).val())
    fnSetQ()
}

function fnMoonLoad() {
    gvQueList = gvMoon.l

    // 문제 섞을거냐
    if ( gvQueSuffle ) gvQueList = shuffleArray(gvQueList);

    // 문제 SelectBox 만들기
    let vStr = ""
    for ( let i = 0; i < gvQueList.length; i++ ) {
        vStr += "<option value=" + i + ">" + (i+1) + "</option>"
    }
    $("#sel_que").html(vStr)

    /*
    gvQueList
    --- input
    m 문제
    v [배열] 보기
    d [배열] 답
    h 해설
    --- 가공
    multiple   [배열] 보기(가공됨)
    myAnswers  [배열] 선택한 답
    finAnswers [배열] 보기 가공의 답

    */
}

// 문제 그린 후 답 체크
function fnSetMyAnswers() {
    let vMyAnswer = gvQueList[gvIndex].myAnswers // 내가 선택한 답
    if ( vMyAnswer == undefined || vMyAnswer.length == 0 ) return

    if ( isMuliple() ) { // 객관식
        for ( let i = 0; i < vMyAnswer.length; i++ ) {
            $('#chkQue'+ (vMyAnswer[i]-1)).prop("checked", true)
        }
    } else { // 주관식
        $('#txtAnswer').val(vMyAnswer)
    }
}

// 객관식이면 return true 주관식은 false
function isMuliple() {
    return !( gvQueList[gvIndex].multiple.length == 0 )
}

// 정답인가?
function isCorrect() {
    let answer = getSelectAnswer()
    let answer2 = gvQueList[gvIndex].finAnswers
    return ( answer.sort().toString() == answer2.sort().toString() )
}

// 작성한 정답을 gvQueList[gvIndex].myAnswers 에 저장
function getSelectAnswer() {
    if ( isMuliple() ) { // 객관식
        let vDap = []
        for ( let i = 0; i < gvQueList[gvIndex].multiple.length; i++ ) {
            if ( $('#chkQue'+ i).is(':checked') ) vDap.push(i+1)
        }
        gvQueList[gvIndex].myAnswers = vDap.sort()
    } else { // 주관식
        gvQueList[gvIndex].myAnswers = [$('#txtAnswer').val().trim()]
    }
    return gvQueList[gvIndex].myAnswers
}

function fnQue(vParam) {
    if ( vParam == "N" ) {
        if ( !$("#div_d").is(":visible")  ) { // 답이 닫혀있으면 답열기
            fnOpenDap()
            return
        }
        if ( gvIndex + 1 >= gvQueList.length ) {
            // 종?
            return
        }
        gvIndex++
        fnSetQ()
    } else if ( vParam == "P" ) {
        if ( gvIndex <= 0 ) {
            // 초?
            return
        }
        gvIndex--
        fnSetQ()
    } else if ( vParam == "C" ) {
        if ( $("#div_d").is(":visible") ) { // 답이 열려있을때
            fnQue("N")
        } else {
            fnOpenDap()
        }
    }
}

// 답을 열어
function fnOpenDap() {
    getSelectAnswer() // 답 저장
    let vCorrect = isCorrect() // 정답이면 true

    // 정답에 따라 색칠
    if ( vCorrect ) {
        $("#div_dapgrouptab").removeClass("alert-danger").addClass("alert-success")
    } else {
        $("#div_dapgrouptab").removeClass("alert-success").addClass("alert-danger")
    }

    // 답 그룹 오픈
    $("#div_dapgroup").show()

    if ( isMuliple() ) {
        // 객관식
        let vMultiple  = gvQueList[gvIndex].multiple
        // 선택한것을 붉은색. 추후 정답을 초록색으로 덧칠함. 한번에 할수있는게 있을텐데
        for ( let i = 0; i < vMultiple.length; i++ ) {
            if ( $('#chkQue'+ i).is(':checked') ) {
                $("#liQue" + i ).addClass("list-group-item-danger")
            }
        }

        // 정답을 초록색
        let vFinAnswers = gvQueList[gvIndex].finAnswers
        for ( let i = 0; i < vFinAnswers.length; i++ ) {
            let k = vFinAnswers[i] - 1
            // 답을 굵게
            $("#chkQueText" + k ).css('font-weight', 'bold')
            $("#liQue" + k ).removeClass("list-group-item-danger").addClass("list-group-item-success")
        }
    } else {
        //TODO 주관식 스타일 수정.
        $('#txtAnswer').addClass(vCorrect?"list-group-item list-group-item-success":"list-group-item list-group-item-danger")
    }
}

// 프로그레스바 그리기
function fnSetProgress() {
    let vPer = gvIndex / gvQueList.length * 100
    let vMent = (gvIndex + 1) + " / " + (gvQueList.length)
    $("#prg_que").attr("aria-valuenow", gvIndex).css("width", vPer + "%").text(vMent)
}

// 문제 그리기
function fnSetQ() {
    fnSetProgress() // 프로그레스바 그리기
    let vQue = gvQueList[gvIndex]
    let n = gvIndex + 1 // 문제번호
    let m = vQue.m // 문제
    let v = vQue.v // [배열] 보기
    let d = vQue.d // [배열] 답
    let h = vQue.h // 해설

    /*
    gvQueList
    --- input
    m 문제
    v [배열] 보기
    d [배열] 답
    h 해설
    --- 가공
    multiple 보기 가공
    finAnswers [배열] 보기 가공의 답
    myAnswers [배열] 선택한 답
    hg 해설 가공
    */

    // 문제 가공 전이라면 가공
    if ( vQue.multiple == undefined ) fnMakeMultiple() // 문제 가공

    let multiple = vQue.multiple // 보기 가공
    let dg = vQue.finAnswers // [배열] 보기 가공의 답
    let hg = vQue.hg // 해설 가공
    let sd = vQue.myAnswers // sd [배열] 선택한 답

    //$("#div_n").html(n) // 번호

    // 임시
    m = fnMakeM(m) // 임시 문제 가공

    $("#div_m").html(n + ". " + m) // 문제
    $("#div_v").html(fnVText()) // 보기 가공
    fnSetMyAnswers() // 내가 저장한 답 그리기

    $("#div_dapgroup").hide() // 답, 해설부분 가리기

    if ( isMuliple() ) {
        let vOneNum = ""
        for ( let i = 0; i < vQue.finAnswers.length; i++ ) {
            if ( i > 0 ) vOneNum += ", "
            vOneNum += fnConvVNum(vQue.finAnswers[i])
        }
        $("#div_d").html('✔ '+ vOneNum ) // 답
    } else {
        $("#div_d").html('✔ '+ dg ) // 답
    }
    $("#div_h").html(hg) // 해설
}

// 보기 가공
function fnMakeMultiple() {
    let v = gvQueList[gvIndex].v // [배열] 보기
    let d = gvQueList[gvIndex].d // [배열] 답
    let h = gvQueList[gvIndex].h // [배열] 답

    if ( v.length == 0 ) { // 보기가 없으면 주관식
        gvQueList[gvIndex].multiple = []
        gvQueList[gvIndex].finAnswers = d
        gvQueList[gvIndex].hg = h
    } else {
        // 객관식
        // 보기 가공 시작
        let vShuffleMap = []
        let vShuffleV = []
        let vShuffleD = []
        for ( let i = 0; i < v.length; i++ ) {
            vShuffleMap.push(i)
            vShuffleV.push("")
        }

        // 보기 섞기 옵션
        if ( gvMulSuffle ) vShuffleMap = shuffleArray(vShuffleMap)

        for ( let i = 0; i < vShuffleMap.length; i++ ) {
            let vReOrg = "__" + (i + 1) + "__"
            let vReStr = fnConvVNum(vShuffleMap[i] + 1)

            // 1. 해설의 보기번호 변경
            h = h.replace(vReOrg, vReStr) // 해설의 __1__,__2__... 바꾼다.

            // 2. 답 변경
            for ( let j = 0; j < d.length; j++ ) {
                if ( d[j] == (i + 1) ) vShuffleD.push(vShuffleMap[i] + 1)
            }

            // 3. 보기 변경
            v[i] = v[i].replace("__" + (i + 1) + "__ ", "") // TODO 임시
            vShuffleV[vShuffleMap[i]] = v[i]
        }
        gvQueList[gvIndex].multiple = vShuffleV
        gvQueList[gvIndex].finAnswers = vShuffleD.sort()
        gvQueList[gvIndex].hg = h
    }
}

// 보기를 html로 변환
function fnVText() {
    let vShuffleV = gvQueList[gvIndex].multiple
    let type = ( gvQueList[gvIndex].finAnswers.length == 1 )? "radio" : "checkbox" // 답이 1개면 라디오 그이상이면 체크

    if ( vShuffleV.length == 0 ) { // 보기가 없으면 주관식
        let vRtn = "<input class='form-control form-control-lg' type='text' id='txtAnswer'>"
        return vRtn
    } else {
        let vRtn = "<ul class='list-group'>"
        for ( let i = 0; i < vShuffleV.length; i++ ) {
            let vv =
            "<li class='list-group-item' id='liQue" + i + "'>"+
            "<div class='form-check'>" +
            "  <input class='form-check-input' type='" + type + "' name='chkQue' id='chkQue" + i + "'>" +
            "  <label class='form-check-label' for='chkQue" + i + "' id='chkQueText" + i + "'>" + fnConvVNum(i+1) + " " + vShuffleV[i] +
            "  </label>" +
            "</div>"+
            "</li>"
            vRtn += vv
        }
        vRtn += "</ul>"
        return vRtn
    }
}

// 숫자를 원숫자로 변경
let gvOneNum = ["①","②","③","④","⑤","⑥","⑦","⑧","⑨","⑩","⑪","⑫","⑬","⑭","⑮"]
function fnConvVNum(n) {
    if ( n > 15 ) return "(" + n + ")"
    return gvOneNum[n-1]
}

// 임시로 문제 앞에 적은 항번 삭제
function fnMakeM(m) {
    let k = m.substr(0, m.indexOf(" "))
    k = k.replace(".","").replace("]","").replace(")","")
    if ( $.isNumeric(k) ) {
        m = m.substr(m.indexOf(" "))
    }
    return m
}
