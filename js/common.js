//一般模式  http://dsurvey.localhost.com
//展場模式  http://dsurvey.localhost.com?mode=1

//--------------------不需要調整---------------------
var COOKIE_KEY_NEED_INSERT_GOOGLE_SHEET = 'NEED_INSERT_GOOGLE_SHEET'; //紀錄需要INSERT
var COOKIE_KEY_MODE = 'MODE'; 											//問卷模式
var COOKIE_VALUE_INSERT_FALSE = '0';									//不需要INSERT
var COOKIE_VALUE_INSERT_TRUE = '1';										//需要INSERT

var COMMON_HTTP_GET_KEY_MODE = "mode";
var COMMON_HTTP_GET_VALUE_NORMAL = "0";								//一般模式
var COMMON_HTTP_GET_VALUE_EXHIBITION = "1";							//展場模式
var COMMON_MODE_EXHIBITION_NAME = "體驗者";							//展場模式，顯示在報告上的使用者名稱
var COMMON_SEPARATE = "@";