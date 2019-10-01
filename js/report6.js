var gFormID = '';
var gSheetParam = {}; //google sheet所需要的參數
var config; //json格式的config設定檔
var reportLink = '';//insert google sheet的連結，不會重複insert google sheet
var userName = '';//使用者在問卷填的名字
var common_mode = COMMON_HTTP_GET_VALUE_NORMAL;//展場模式  預設一般模式
var need_insert_google_sheet = COOKIE_VALUE_INSERT_FALSE;


$(function() {
    console.log('start() ver=6-3');
    // alert('start() ver=7');//todo test
    var qmconfig; //json格式的question mapping設定檔
    initCookies();
    initLoadingAnimation();
    initConfig();
    initDownloadButton();

    function initLoadingAnimation(){
        console.log('initLoadingImage()');
        $("#report").hide();
        $('#loadingimg').imgLoad(function(){
            // 圖片讀取完成
            setTimeout(function() {
                $( "#loading" ).fadeOut( "1000", function() {//loading頁 fade out
                    $( "#report" ).fadeIn( "100", function() {});//report頁 fade in
                });
            }, 2700);
        });
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
                gFormID = config.fid;
                initQuestionMapping();
            }
        });
    }

    function initCookies(){
        console.log('initCookies()');
        //報告模式
        var tmp_common_mode = Cookies.get(COOKIE_KEY_MODE);
        if ((typeof tmp_common_mode != 'undefined')) {
            common_mode = tmp_common_mode;
            Cookies.remove(COOKIE_KEY_MODE);//刪除cookie
            $('#back').attr('href','index.html?mode='+common_mode);
        } 
        //是否insert google sheet
        var tmp_need_insert_google_sheet = Cookies.get(COOKIE_KEY_NEED_INSERT_GOOGLE_SHEET);
        if (typeof tmp_need_insert_google_sheet != 'undefined'){
            need_insert_google_sheet = tmp_need_insert_google_sheet;
            Cookies.remove(COOKIE_KEY_NEED_INSERT_GOOGLE_SHEET);//刪除cookie  
        }
    }

    function initQuestionMapping() {
        console.log('initQuestionMapping()');
        // 讀取config檔案
        $.ajax({
            cache: false,
            url: "config/qmconfig.json",
            dataType: "json",
            success: function(data) {
                // console.log('initQuestionMapping() success');
                qmconfig = data;
                initHttpGet();
                updateConfig();

            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.log(textStatus, errorThrown);
            }

        });
    }


    //將user的分數塞入config檔案
    function updateConfig() {
        console.log('updateConfig()');
        $.each(config.session, function(i, item_session) {
            //跑完所有question
            $.each(item_session.question, function(j, item_question) {
                var qid = getUrlVar(item_question.qid);
                if (typeof qid != 'undefined') {
                    item_question.value = getUrlVar(item_question.qid); // json object set value    
                } else {
                    item_question.value = '3'; //set default
                }
            });
        });
        // console.log('config=' + JSON.stringify(config));
        calculate();
    }


    //計算data
    function calculate() {
        console.log('calculate()');
        var A = calculate_A(config, qmconfig);
        var B_typeA = calculate_B_typeA(qmconfig);
        var B_typeB = calculate_B_typeB(qmconfig);
        var C = calculate_C(qmconfig);
        var D = calculate_D(qmconfig,userName);

        updateUI(B_typeA);
        updateUI_B_typeB(B_typeB);
        updateUI_C(C);
        updateUI_A(A);
        var D_combine_format =  updateUI_D(D);

        var gMergeParam = createGMergeParam(A, B_typeA, B_typeB, C, D_combine_format);
        sendGoogleSheet(gMergeParam);

    }

    //update UI
    function updateUI_A(A) {
        $.each(A, function(index, data) {
            var outputTitle = '#ui_A_' + (index + 1) + '_1';
            var outputDetail = '#ui_A_' + (index + 1) + '_2';
            var title = A[index].title;
            var detail = A[index].detail;
            $(outputTitle).append(title);
            $(outputDetail).append(detail);
        });
    }

    function updateUI(B_typeA) {
        $.each($('.ui_B_1'), function(index, data) {
            var data_B_1 = B_typeA[0];
            if ((index >= data_B_1.length)) { $(this).hide(); return; } //超過長度
            $('#card-B-1-default').hide();
            $(this).html(data_B_1[index].title);
        });

        $.each($('.ui_B_2'), function(index, data) {
            var data_B_2 = B_typeA[1];
            if ((index >= data_B_2.length)) { $(this).hide(); return; }
            $('#card-B-2-default').hide();
            $(this).html(data_B_2[index].title);

        });
    }

    function updateUI_B_typeB(B_typeB) {

        $.each($('.ui_B_3'), function(index, data) {
            var data_B_3 = B_typeB[0];
            if ((index >= data_B_3.length)) {
                // console.log('ui_B_3 index=' + index);
                $(this).hide();
                return; //超過長度
            }
            $('#card-B-3-default').hide();
            $(this).html(data_B_3[index].title);
        });

        $.each($('.ui_B_4'), function(index, data) {
            var ui_B_4 = B_typeB[1];
            if ((index >= ui_B_4.length)) {
                $(this).hide();
                return; //超過長度
            }
            $('#card-B-4-default').hide();
            $(this).html(ui_B_4[index].title);
        });
        $.each($('.ui_B_5'), function(index, data) {
            var ui_B_5 = B_typeB[2];
            if ((index >= ui_B_5.length)) { $(this).hide(); return; } //超過長度
            $('#card-B-5-default').hide();
            $(this).html(ui_B_5[index].title);
        });
    }


    function updateUI_C(C) {
        $.each($('.ui_C_1'), function(index, data) {
            var data_C = C[0];
            if ((index >= data_C.length)) { $(this).hide(); return; } //超過長度
            $('#card-C-1-default').hide();
            $(this).html(data_C[index].title);
        });

        $.each($('.ui_C_2'), function(index, data) {
            var data_C = C[1];
            if ((index >= data_C.length)) { $(this).hide(); return; } //超過長度
            $('#card-C-2-default').hide();
            $(this).html(data_C[index].title);
        });

    }

    function updateUI_D(D) {
        //因為前台title的wording css不同，因此拆分成3個物件
        //resultTitle 格式 = 1;[使用者名稱] + 2.[總分] + 3.[總分評語]
        $('#ui_D_1_1_username').html(D.title.split(COMMON_SEPARATE)[0]);
        $('#ui_D_1_2_total_value').html(D.title.split(COMMON_SEPARATE)[1]);
        $('#ui_D_1_3_total_wording').html(D.title.split(COMMON_SEPARATE)[2]);
        $('#ui_D_2').append(D.detail);

        //將完整title組合
        var combine_title = '';
        $.each($("#ui_D_1 div"), function(index, data) {
            combine_title += $(this).text();
        });
        return new DataTypeB(combine_title, D.detail);
    }
});


//1.將http get參數存放到物件「gSheetParam」
//2.組合出google sheet url 「reportLink」
function initHttpGet() {
    console.log('initHttpGet()');
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    reportLink += window.location.href.split('?')[0] + '?';

    var KEY_USER_NAME = config.inputField[0].question[0].qid;//用戶姓名qid，需要動態取得，因為qid不是固定(正式/測試不一樣)

    
    var hash;
    for (var i = 0; i < hashes.length; i++) {
        hash = hashes[i].split('=');
        var key = hash[0];
        var value = hash[1];

        value = value.replace(',','');//將逗號移除，避免G-Merge使用逗號拆資料時，發生異常。

        if(key == KEY_USER_NAME) {//取得用戶姓名，並存在物件
            userName = decodeURIComponent(value);
        }

        //問卷題目
        reportLink += (key + '=' + value + '&');
        gSheetParam['entry.' + key] = decodeURIComponent(value); 

    }
    //如果reportLink最後是「?」，則移除
    if (reportLink.charAt(reportLink.length - 1) == '&') {
        reportLink = reportLink.substring(0, reportLink.length - 1);
    }
    // console.log('reportLink='+reportLink);
    // console.log('initHttpGet()='+JSON.stringify(gSheetParam));
}

//1. 提供method取得物件「gSheetParam」參數
function getUrlVar(name) {
    var result = gSheetParam[('entry.' + name)];
    return typeof result != 'undefined' ? result : '1';
}

//send gooogle sheet request
function sendGoogleSheet(gMergeParam) {

    if (need_insert_google_sheet == COOKIE_VALUE_INSERT_FALSE) {
        console.log('NO send google sheet (cookie)');
        return false;
    }
    console.log('send google sheet (cookie)');

    //額外送出欄位1. USER優氧循環 2.USER建議清單
    var linkQid = config.systemField[0].question[0].qid; //儲存連結欄位
    var gMergeQid = config.systemField[0].question[1].qid; //google sheet plugin G-Merge所需欄位
    gSheetParam['entry.' + linkQid] = reportLink;
    gSheetParam['entry.' + gMergeQid] = gMergeParam.toString(); //toString預設就會使用comma隔開所有參數

//todo 暫時不送
    // console.log('send google sheet參數=' + JSON.stringify(gSheetParam));
    // console.log('https://docs.google.com/forms/d/e/' + gFormID + '/formResponse?' + JSON.stringify(gSheetParam));
    $.ajax({
        url: 'https://docs.google.com/forms/d/e/' + gFormID + '/formResponse',
        data: gSheetParam,
        type: "POST",
        dataType: "xml",
        statusCode: {
            0: function() {
                console.log('Success message');
            },
            200: function() {
                console.log('Success message');
            }
        }
    });
}

//組合出gMerge需要的參數，並存放在array
//因為資料來自於計算結果，因此此段程式要放後面執行。
function createGMergeParam(A, B_typeA, B_typeB, C, D) {
    var result = [];
    $.each(A, function(index, data) {
        var title = A[index].title;
        var detail = A[index].detail;
        result.push(title);
        result.push(detail);
    });

    function getUiData(uiTypeObject) {
        // console.log('getUiData()');
        //B_typeA
        $.each(uiTypeObject, function(object, data) {
            for (var index = 0; index < 3; index++) {
                if (data.length > index) {
                    //因為B_typeA[0]長度不一定有3個，因此要先判斷長度  
                    result.push(data[index].title);
                } else {
                    result.push(''); //沒有值，帶入空字串
                }
            }
        });
    }

    getUiData(B_typeA); //B_typeA
    getUiData(B_typeB); //B_typeB
    getUiData(C); //C

    //D
    result.push(D.title);
    result.push(D.detail);

    // console.log('result.toString()='+result.toString());
    return result.toString();
}

//下載檔案到local
// function saveAs(uri, filename) {
//     var link = document.createElement('a');
//     if (typeof link.download === 'string') {
//         link.href = uri;
//         link.download = filename;
//         //Firefox requires the link to be in the body
//         document.body.appendChild(link);
//         //simulate click
//         link.click();
//         //remove the link when done
//         // document.body.removeChild(link);//todo 測試暫時移除
//     } else {
//         window.open(uri);
//     }
    
// }

function initDownloadButton() {
    $("#downloadReport").on('click', function() {
        console.log('initDownloadButton()');

        var image_quality = 1.0;
        if (isAndroid()) {
            image_quality = 0.2;
        }

        html2canvas(document.getElementById("capture")).then(function(canvas) {
            var link = document.createElement('a');
            link.download = '優氧循環檢驗報告.jpg';
            link.href = canvas.toDataURL("image/jpg",image_quality);
            link.click();
        });

        // html2canvas(document.querySelector("#capture")).then(canvas => {
        //     // saveAs(canvas.toDataURL(), '優氧循環檢驗報告.png');
        //     var link = document.createElement('a');
        //     link.download = '優氧循環檢驗報告.jpg';
        //     link.href = canvas.toDataURL("image/jpeg",0.5);
        //     link.click();
        // });
        // html2canvas(document.getElementById("testdiv2")).then(function(canvas) {
        //     saveAs(canvas.toDataURL(), '詳細頁面.png');
        // });
    });

    //iOS手機不顯示下載按鈕
    if (!isDownloadButtonShow()) {
        $("#downloadReport").hide();
    }

    //android手機顯示hint
    if (isAndroid()) {
        console.log('download_android_hint show');
        $("#download_android_hint").show();
    }else{
        console.log('download_android_hint hide');
        $("#download_android_hint").hide();
    }
}

//android手機顯示hint
function isAndroid(){
    var deviceAgent = navigator.userAgent.toLowerCase();//裝置agent
    var agentID = deviceAgent.match(/(android)/);
    if (agentID) {
        return true;
    }else{
        return false;
    }
}

//iOS手機不顯示下載按鈕
function isDownloadButtonShow(){
    var deviceAgent = navigator.userAgent.toLowerCase();//裝置agent
    $("#agent").append(deviceAgent);
    var agentID = deviceAgent.match(/(iphone|ipod|ipad)/);
    if (agentID) {
        return false;
    }else{
        return true;
    }
}

/**
 * 當圖片讀取finish 回傳callback
 * Trigger a callback when 'this' image is loaded:
 * @param {Function} callback
 */
(function($){
    $.fn.imgLoad = function(callback) {
        return this.each(function() {
            if (callback) {
                if (this.complete || /*for IE 10-*/ $(this).height() > 0) {
                    callback.apply(this);
                }
                else {
                    $(this).on('load', function(){
                        callback.apply(this);
                    });
                }
            }
        });
    };
})(jQuery);