//--------------public --------------
//計算
//1. -----D-1
//2. -----A-[1-5]-[1]
//3. -----A-[1-5]-[2]
var uiValue = []; //要呈現在UI，各項「分數」，其它method會用到，所以放public
var uiTotalValue; //D-1要呈現在UI，總「分數」，其它method會用到，所以放public
function calculate_A(config, qmconfig) {
    console.log('calculate_A()');
    var resultArray = [];
    var totalScoreArray = []; //所有session分數陣列 -> 為了取最大值 (將5大類分數陳列)
    var totalSumScore = 0; //所有session分數加總 -> 為了取平均值 (將5大類分數累加)

    $.each(config.session, function(sIndex, item_session) {

        if (sIndex >4) {
            // console.log('已經超過5個session，第6個自控力');
            return false;
        }

        // console.log('item_session='+JSON.stringify(item_session));
        var scoreArray = []; //單一session所有問題，轉換成分數陣列    -> 為了取最大值
        var sumScore = 0; //單一session所有問題的分數加總      -> 為了取平均值

        $.each(item_session.question, function(j, item_question) {
            var score = valueToScore(parseInt(item_question.value));
            sumScore += score;
            scoreArray.push(score);
        });

        //最大值
        var valueMax = Math.max.apply(null, scoreArray);
        // console.log(item_session.title+' 最大值='+valueMax);

        //平均值
        var valueAverage = sumScore / item_session.question.length;
        // console.log(item_session.title+' 平均值='+valueAverage);

        //1.綜合平均值 2.取4捨5入到小數第1位
        var temp = (valueMax + valueAverage) / 2;
        // console.log('temp=' + temp);
        totalSumScore += temp;
        totalScoreArray.push(temp);
        uiValue.push(Math.round(temp * 10) / 10);
    });

    //根據各項分數(供、耗、熱、濕、寒)，取得對應文字wording
    //耦合高，暫時維持現狀。
    var targetArray = uiValue;
    var compareArray = qmconfig.A.A_compare;
    $.each(targetArray, function(sIndex, value) {
        var target = targetArray[sIndex];
        $.each(compareArray, function(mIndex, compare) {
            if (target <= compare) {

                var title;
                try {
                    title = qmconfig.A.session[sIndex].question[mIndex].title;
                } catch (e) {console.log(e);}
                wording = (typeof title != 'undefined') ? title : 'SETTING ERROR';
                // var wording = qmconfig.A.session[sIndex].question[mIndex].title;
                // console.log('targetArray[sIndex]' + targetArray[sIndex] + ' wording=' + wording);
                resultArray.push(new DataTypeB(targetArray[sIndex], wording));
                return false;
            }
        });
    });

    //計算D-1
    var tempValueMax = Math.max.apply(null, totalScoreArray);
    var tempValueAverage = (totalSumScore / 5);//不能使用config.session.length當分母，因為單項平均分數不包含自控力。因此直接hardcode分母=5
    //1.綜合平均值 2.取4捨5入到小數第1位
    uiTotalValue = (tempValueMax + tempValueAverage) / 2;
    uiTotalValue = Math.round(uiTotalValue * 10) / 10;

    // console.log('resultArray=' + JSON.stringify(resultArray));
    return resultArray;
}


//計算
//1.  B-1-[1-3]
//2.  B-2-[1-3]
function calculate_B_typeA(qmconfig) {
    console.log('calculate_B_typeA()');

    var uiResult = [];

    //each session
    $.each(qmconfig.B_typeA.session, function(i, item_session) {
        var tempArray = []; //暫存存放
        var tempLifeArray = []; //「生活型態建議」陣列
        var tempExerciseArray = []; //「運動處方」陣列

        //取得所有「生活型態建議」
        var isNeedQuestion = qmconfig.B_typeA.B_typeA1_compare;
        // console.log('item_session='+JSON.stringify(item_session));
        tempLifeArray = getQuestionArray(item_session, isNeedQuestion);
        // console.log('要顯示的生活型態: session='+i+' tempLifeArray='+JSON.stringify(tempLifeArray ));

        //是否需要使用「運動處方」
        var isNeedExercise = uiValue[i] > qmconfig.B_typeA.B_typeA1_exercise;
        tempExerciseArray = getExerciseArray(item_session, isNeedExercise);

        //將tempLifeArray賽入 array
        $.each(tempLifeArray, function(sIndex, item_singleadvisement) {

            if (sIndex >= 2 && isNeedExercise) {
                //第3項需要顯示「運動處方建議」，因此不增加「生活型態建議」
                return false;
            }
            //生活型態建議
            tempArray.push(new DataTypeB(item_singleadvisement.title, item_singleadvisement.detail));

        });

        if (isNeedExercise && tempExerciseArray.length > 0) {
            //運動處方建議
            tempArray.push(new DataTypeB(tempExerciseArray[0].title, tempExerciseArray[0].detail));
        }
        uiResult.push(tempArray);
    });


    // console.log('「uiResult」=' + JSON.stringify(uiResult)); //「uiResult」=[[{"title":"「生活型態建議」練習「以口吸氣，鼻用力呼氣」的深呼吸運動"},{"title":"「生活型態建議」多利用抽風機、電風扇幫助空間換氣"},{"title":"「運動處方建議」加強鍛鍊胸肌、腹肌、上背肌等呼吸肌群。"}],[{"title":"「運動處方建議」紓壓打擊運動可緩減情緒緊繃。"}]]
    return uiResult;
}


//1. -----B_typeB----- B-3-1,B-3-2,B-3-3 / B-4-1,B-4-2,B-4-3 / B-5-1,B-5-2,B-5-3
function calculate_B_typeB(qmconfig) {
    console.log('calculate_B_typeB()');
    var uiResult = [];
    // console.log('uiValue='+JSON.stringify(uiValue));

    //each session
    $.each(qmconfig.B_typeB.session, function(sIndex, item_session) {
        var tempUiValue = uiValue[sIndex + 2]; // session平均值
        var tempArray = []; // 暫存存放
        var tempLifeArray = []; //「生活型態建議」陣列

        //【排序規則一】飲食處方第一優先
        //【排序規則二】運動處方第二順位
        var isNeedFood = tempUiValue > qmconfig.B_typeB.B_typeB1_food;
        // console.log('isNeedFood='+isNeedFood+' uiValue[sIndex]='+tempUiValue +' qmconfig.B_typeB.B_typeB1_food='+qmconfig.B_typeB.B_typeB1_food);
        var isNeedExercise = tempUiValue > qmconfig.B_typeB.B_typeB1_exercise;
        if (isNeedFood) { tempArray.push(new DataTypeB(item_session.food.title, item_session.food.detail)); }
        if (isNeedExercise) { tempArray.push(new DataTypeB(item_session.exercise.title, item_session.exercise.detail)); }

        var isNeedQuestion = qmconfig.B_typeB.B_typeB1_compare;
        //取得所有「生活型態建議」
        tempLifeArray = getQuestionArray(item_session, isNeedQuestion);

        //將tempLifeArray賽入 array
        $.each(tempLifeArray, function(tIndex, item_tempLift) {
            if (tempArray >= 3) {
                //最多只取3項目
                return false;
            }
            //生活型態建議
            tempArray.push(new DataTypeB(item_tempLift.title, item_tempLift.detail));

        });

        uiResult.push(tempArray);

    });
    // console.log('uiResult=' + JSON.stringify(uiResult));

    return uiResult;
}


//1. -----C----- C-1,C-2
function calculate_C(qmconfig) {
    console.log('calculate_C()');
    var uiResult = [];

    //each session
    $.each(qmconfig.C.session, function(sIndex, item_session) {
        var tempArray = []; //暫存存放
        var filterArray = [];

        var isNeedQuestion = qmconfig.C.C_compare; //過濾條件
        //取得所有「自控建議」
        filterArray = getFilterArray(item_session, isNeedQuestion);

        //將filterArray賽入 array
        $.each(filterArray, function(sIndex, item_filter) {
            if (tempArray >= 3) {
                //最多只取3項目
                return false;
            }
            tempArray.push(new DataTypeB(item_filter.title, item_filter.detail));

        });

        uiResult.push(tempArray);

    });
    // console.log('uiResult=' + JSON.stringify(uiResult));

    return uiResult;
}


//D-[1-4]
function calculate_D(qmconfig, userName) {
    console.log('calculate_D()');
    var resultTitle = '';
    var resultDatail = ''; //總分建議
    var scoreArray = uiValue; //各項分數

    
    //resultTitle 格式 = 1;[使用者名稱] + 2.[總分] + 3.[總分評語]
    //組合[使用者名稱] 
    userName = ((common_mode == COMMON_HTTP_GET_VALUE_NORMAL) ? userName : COMMON_MODE_EXHIBITION_NAME);
    resultTitle += userName;
    
    //組合[總分] 
    resultTitle += COMMON_SEPARATE + uiTotalValue;//[@]隔開array

    //組合[總分評語] 
    //根據分數，取得對應range文字wording，耦合高，暫時維持現狀。
    var compareArray = qmconfig.D.D_compare;
    var target = uiTotalValue;
    
    $.each(compareArray, function(mIndex, compare) {
        // console.log('compare='+compare +' target='+target);
        if (target <= compare) {
            resultTitle += COMMON_SEPARATE + qmconfig.D.D_2[mIndex].title;//[@]隔開array
            return false;
        }
    });
    //--------title--------

    //--------detail--------
    //D-3
    if (scoreArray[0] > scoreArray[1] && scoreArray[0] > 2) {
        resultDatail += qmconfig.D.D_3[0].title;
    } else if (scoreArray[1] >= scoreArray[0] && scoreArray[1] > 2) {
        resultDatail += qmconfig.D.D_3[1].title;
    } else if (scoreArray[0] <= 2 && scoreArray[1] <= 2 && scoreArray[2] <= 3 && scoreArray[3] <= 3 && scoreArray[4] <= 3) {
        resultDatail += qmconfig.D.D_3[3].title;
    } else if (scoreArray[0] <= 2 && scoreArray[1] <= 2) {
        resultDatail += qmconfig.D.D_3[2].title;
    } else {
        resultDatail += "";
    }

    //D-4
    if (scoreArray[2] > scoreArray[3] && scoreArray[2] > scoreArray[4] && scoreArray[2] > 3) {
        // console.log('D-1');
        resultDatail += qmconfig.D.D_4[0].title;
    } else if (scoreArray[3] >= scoreArray[2] && scoreArray[3] >= scoreArray[4] && scoreArray[3] > 3) {
        // console.log('D-2');
        resultDatail += qmconfig.D.D_4[1].title;
    } else if (scoreArray[4] >= scoreArray[2] && scoreArray[4] > scoreArray[3] && scoreArray[4] > 3) {
        // console.log('D-3');
        resultDatail += qmconfig.D.D_4[2].title;
    } else if (scoreArray[0] <= 2 && scoreArray[1] <= 2 && scoreArray[2] <= 3 && scoreArray[3] <= 3 && scoreArray[4] <= 3) {
        // console.log('D-4');
        resultDatail += qmconfig.D.D_4[3].title;
    } else if (scoreArray[2] <= 3 && scoreArray[3] <= 3 && scoreArray[4] <= 3) {
        // console.log('D-5');
        resultDatail += qmconfig.D.D_4[4].title;
    } else {
        // console.log('D-else');
        if (resultDatail.charAt(resultDatail.length - 1) == '，') {
            resultDatail = resultDatail.substring(0, resultDatail.length - 1);
        }
    }

    //--------detail--------
    return new DataTypeB(resultTitle, resultDatail);
}

//--------------private --------------


function DataTypeB(title, datail) {
    this.title = title;
    this.detail = datail;
}



/**
取得「運動處方建議」並排序
input
session : {MEMO,exercise,qidGroup,sort}
isNeedQuestion : 分數大於config設定，符合條件，加入陣列
*/
function getExerciseArray(session, isNeedExercise) {
    console.log('getExerciseArray()');
    var resultExerciseArray = []; //「運動處方建議」陣列

    if (isNeedExercise) {
        //取得運動處方陣列
        $.each(session.exercise, function(eIndex, item_exercise) {
            resultExerciseArray.push(item_exercise);
        });
        // console.log('「運動處方建議」排序前 resultExerciseArray=' + JSON.stringify(resultExerciseArray));

        //運動處方進行排序
        //【排序規則一】取出「供給性缺氧」問題1~4(表3欄位建議a)填答結果
        //【排序規則一】(模組)分數換算
        //【排序規則一】問題1~4換算出的分數相加
        //【排序規則一】各自相加後得到三組對應於運動建議a、b、c的總和分數；再依分數高低由高至低排序。
        //【排序規則二】同分時，依照各建議優先順序設定排序。(參考表3欄位「運動排序規則2」)
        resultExerciseArray.sort(function(a, b) {
            function cmp(x, y) {
                return x > y ? 1 : (x < y ? -1 : 0); //等於的時候不要動
            }

            function sumScore(qidGroup) {
                //【排序規則一】(模組)分數換算
                //【排序規則一】問題1~4換算出的分數相加
                var totalScore = 0;
                $.each(qidGroup, function(qidIndex, item_qidGroup) {
                    totalScore += valueToScore(parseInt(getUrlVar(item_qidGroup.qid)));
                });
                return totalScore;
            }

            var sumScoreA = sumScore(a.qidGroup);
            var sumScoreB = sumScore(b.qidGroup);
            // console.log('由大到小排序.  sumScoreA=' + sumScoreA +' sumScoreB='+sumScoreB);                        
            return cmp(sumScoreB, sumScoreA) || cmp(a.sort, b.sort); //return score是第一條件，sort為第2條件
        });
        // console.log('「運動處方建議」 排序後=' + JSON.stringify(resultExerciseArray));//「運動處方建議」 排序後=[{"qidGroup":[{"qid":"1848259859"},{"qid":"1221090849"}],"title":"加強鍛鍊胸肌、腹肌、上背肌等呼吸肌群。","sort":3},{"qidGroup":[{"qid":"299261106"}],"title":"進行脊椎、豎脊肌伸展運動。","sort":1}]
    }
    return resultExerciseArray;
}





/**
1. 取得答題分數符合條件的題目 2.排序
input
session         : {MEMO,question,question.id,sort}
isNeedQuestion  : 分數大於config設定，符合條件，加入陣列
*/
function getQuestionArray(session, isNeedQuestion) {
    console.log('getQuestionArray()');
    var resultLifeArray = getFilterArray(session, isNeedQuestion); //取得符合資格陣列「生活型態建議」陣列
    // console.log('要顯示的生活型態: session='+session.MEMO+' resultLifeArray='+JSON.stringify(resultLifeArray ));
    // 「生活型態建議」排序
    //【建議排序規則一】依照各題填答結果換算出的分數高低，由高至低排序。 
    //【建議排序規則二】同分時，依照各建議優先順序設定排序。(參考表3欄位「生活排序規則2」)
    // console.log(session.MEMO + '「生活型態建議」排序前=' + JSON.stringify(resultLifeArray));
    resultLifeArray.sort(function(a, b) {
        function cmp(x, y) {
            return x > y ? 1 : (x < y ? -1 : 0); //等於的時候不要動
        }
        var scoreA = valueToScore(parseInt(getUrlVar(a.qid)));
        var scoreB = valueToScore(parseInt(getUrlVar(b.qid)));
        return cmp(scoreB, scoreA) || cmp(a.sort, b.sort); //return score是第一條件，sort為第2條件
    });

    // console.log(session.MEMO + '「生活型態建議」排序後=' + JSON.stringify(resultLifeArray)); //「生活型態建議」排序後=[{"qid":"299261106","title":"練習「以口吸氣，鼻用力呼氣」的深呼吸運動","sort":2},{"qid":"1848259859","title":"多利用抽風機、電風扇幫助空間換氣","sort":9},{"qid":"1221090849","title":"增加氧源，栽植室內盆栽","sort":10}]
    return resultLifeArray;
}

/**
取得答題分數符合條件的題目，並回傳陣列
input
session         : {question,question.qid}
isNeedQuestion  : 分數大於config設定，符合條件，加入陣列
*/
function getFilterArray(session, condition) {
    var filterArray = [];

    // console.log('session=' + JSON.stringify(session));

    $.each(session.question, function(qIndex, item_question) {

        var score = parseInt(getUrlVar(item_question.qid));

        score = valueToScore(score);
        // console.log('item_question score=' + score);

        if (score >= condition) {
            //分數大於config設定，符合條件，加入陣列
            filterArray.push(item_question);
        }
    });

    return filterArray;
}

//(模組)分算換算
function valueToScore(value) {
    switch (value) {
        case 1:
            return 0;
        case 2:
            return 2.5;
        case 3:
            return 5;
        case 4:
            return 7.5;
        case 5:
            return 10;
    }
}