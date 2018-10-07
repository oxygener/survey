var COOKIE_KEY_LAST_RECORD_URL = 'LAST_RECORD'; //上一次檢驗報告記錄
var CONFIG_DEFAULT_SELECT = 2; //radio預設選項
var currentPage = 0;//預設第一頁pages

var config; //json格式的config設定檔
var questions = [];

$(function() {
    initConfig();
});

function goNextPage(pageUrl) {
    console.log('goNextPage');
    //解除綁定
    $(window).unbind('beforeunload');

    //導網址
    window.location.href = pageUrl;
}




function initConfig() {
    console.log('initConfig()');
    // 讀取config檔案
    $.ajax({
        cache: false,
        url: "config/config.json",
        dataType: "json",
        success: function(data) {
            config = data;
            init();
        }
    });
}

function init() {
    console.log('init()');
    initQuestions();
    initInputField();
    initSessionUI();

    $('.page').hide();
    $('.page').eq(currentPage).show();



    $(window).bind('beforeunload', function(e) {
        console.log('beforeunload');
        return '資料尚未存檔，確定是否要離開？'; //Chrome v51 (2016/04) 取消自訂wording
    });

    //預設勾選第一個radio button
    $('fieldset').each(function(index, element) {
        $(this).find('input').eq(CONFIG_DEFAULT_SELECT).attr('checked', true);
    });

    //檢查是否有上次檢驗報告紀錄
    var lastRecordUrl = Cookies.get(COOKIE_KEY_LAST_RECORD_URL);
    if (typeof lastRecordUrl != 'undefined') {
        //cookie有值
        $('#btn_lastRecordUrl').show();

        $('#btn_lastRecordUrl').click(function() {
            goNextPage(lastRecordUrl);
            return false; //false : 結束button後續動作
        });
    } else {
        //cookie沒有值
        $('#btn_lastRecordUrl').hide();
    }

    //設定上下頁按鈕
    
    $("#btn_pre").hide();
    $("#btn_pre").click(function() {
        gotoNextAction(--currentPage);
    });

    $("#btn_next").click(function() {
        //必填未填
        if (!checkInputField()) { return false; }

        gotoNextAction(++currentPage);
    });

    //問卷上/下頁 or 結束問卷
    function gotoNextAction(page) {
        if (currentPage != 0) {
            $("#btn_pre").show();
        } else {
            $("#btn_pre").hide();
        }
        //如果是最後一頁，跳到檢驗報告頁
        if (page >= $(".page").length) {
            onClickSubmit();
        } else {
            //顯示上/下一頁
            $(".page").hide();
            $('.page').eq(page).show();

            //set environment
            window.scrollTo(0, 0); //跳到top
        }

        updateNextButtonImage(page);
    }

    //修改按鈕image
    function updateNextButtonImage(page){
        $("#btn_next").attr('src','image/index/p'+page+'/p'+page+'_next.jpg');
    }

    //點擊問卷送出
    function onClickSubmit() {

        var url = 'report.html?';

        // 取得input field value
        url += $('#ui_if_0_0_value').attr('name') + '=' + $('#ui_if_0_0_value').val() + '&';
        url += $('#ui_if_0_1_value').attr('name') + '=' + $('#ui_if_0_1_value').val() + '&';
        url += $('#ui_if_1_0_value').attr('name') + '=' + $('#ui_if_1_0_value').val() + '&';
        url += $('#ui_if_1_1_value').attr('name') + '=' + $('#ui_if_1_1_value').val() + '&';
        url += $('#ui_if_1_2_value').attr('name') + '=' + $('#ui_if_1_2_value').val() + '&';
        url += $('#ui_if_2_0_value').attr('name') + '=' + $('#ui_if_2_0_value').val() + '&';


        // 取得radio button value
        $('input:checked').each(function(index, element) { //取得Radio button 有check的。
            var qid = $(this).attr('name'); //取得google form id
            var value = $(this).attr('value'); //取得radio button value
            url += qid + '=' + value;

            if (index != $('input:checked').length - 1) { url += '&'; } //最後一個參數不加&
        });



        //將參數記錄至cookie，下次使用
        Cookies.set(COOKIE_KEY_LAST_RECORD_URL, url, { expires: 365 });

        //導網址
        goNextPage(url);

    }
}

//將問題從config檔塞到questions[]
function initQuestions() {
    $.each(config.inputField, function(cIndex, item_inputField) {
        $.each(item_inputField.question, function(sIndex, item_question) {
            questions[item_question.qid] = item_question.title;
        });
    });

    $.each(config.session, function(cIndex, item_session) {
        $.each(item_session.question, function(sIndex, item_question) {
            questions[item_question.qid] = item_question.title;
        });
    });
}

//1. 提供method取得物件questions[]
function getQuestionsVar(name) {
    var result = questions[name];
    return typeof result != 'undefined' ? result : '1';
}

// 設定ui inputField
// 1. 顯示的title 2. 欄位的「name」屬性，以便將資料送出使用。  
function initInputField() {

    $(".datepicker").datepicker({
        dateFormat: 'yy-mm-dd',
        changeMonth: true,
        changeYear: true,
        yearRange: '-100y:c+nn',
        maxDate: '-1d',

    });

    //page1 聯絡資訊
    //title
    $('#page1-contact-title').html(config.page[0].title);
    //subtitle
    $('#page1-contact-subtitle').html(config.page[1].subtitle);
    //input 姓名
    $('#ui_if_0_0_value').attr('placeholder', config.inputField[0].question[0].title);
    $('#ui_if_0_0_value').attr('name', config.inputField[0].question[0].qid);
    //input 生日
    $('#ui_if_0_1_value').attr('placeholder', config.inputField[0].question[1].title);
    $('#ui_if_0_1_value').attr('name', config.inputField[0].question[1].qid);

    //page2
    $('#page2-radio-header-title').html(config.page[1].title);//title
    $('#page2-radio-header-subtitle').html(config.page[1].subtitle);//subtitle
    //page3
    $('#page3-radio-header-title').html(config.page[2].title);
    $('#page3-radio-header-subtitle').html(config.page[2].subtitle);
    //page4
    $('#page4-radio-header-title').html(config.page[3].title);
    $('#page4-radio-header-subtitle').html(config.page[3].subtitle);

    //page5 您的收件電郵地址
    for (var index = 0;index<3;index++) {
        var inputField = config.inputField[1];
        var title = inputField.question[index].title;
        var qid = inputField.question[index].qid;
        $('#ui_if_1_'+index+'_value').attr('placeholder', title);
        $('#ui_if_1_'+index+'_value').attr('name', qid);
    }
    //page5 您的服務人員（客戶專用）
    //title
    $('#page5-1-contact-title').html(config.page[4].title);
    $('#page5-1-contact-subtitle').html(config.page[4].title);
    $('#page5-2-contact-title').html(config.page[5].title);
    $('#page5-2-contact-subtitle').html(config.page[5].title);
    //subtitle
    $('#page1-contact-subtitle').html(config.page[1].subtitle);
    $('#ui_if_2_0_value').attr('placeholder', config.inputField[2].question[0].title);
    $('#ui_if_2_0_value').attr('name', config.inputField[2].question[0].qid);
}

//檢查是否有必填未填
function checkInputField() {
    console.log('checkInputField()');
    var isValid = true;

    $('input:visible').not(".optional").each(function() {
        if (!$(this).val()) {
            var qid = $(this).attr('name');
            alert('問題「' + getQuestionsVar(qid) + '」未填');
            isValid = false;
            return false; //跳離each，還是會繼續走method的程式
        }
    });

    return isValid;
}
//在UI上面產生題目
function initSessionUI() {
    console.log('initSessionUI()');
    var source = document.getElementById("entry-template").innerHTML;
    var template = Handlebars.compile(source);

    for(var sIndex=0;sIndex<6;sIndex++) {
        var session = config.session[sIndex].question;
        //hint text

        //取得page的element ID
        var pageIndex = 0;
        if (sIndex==0 || sIndex==1) {pageIndex = 2;}
        if (sIndex==2 || sIndex==3 || sIndex==4) {pageIndex = 3;}
        if (sIndex==5) {pageIndex = 4;}

        //取得hint text
        var hintText = config.page[pageIndex-1].hint;//+'('+(index+1)+')'; 

        $.each(session, function(index, data) {
            var context = { title: data.title, name: data.qid, hint: hintText};
            var html = template(context);

            
            var pageID = '#page'+pageIndex+'-question';
            //append html
            $(pageID).append(html);
        });
    }
}