var moment = require('moment');
exports.birthdayToAge = function birthdayToAge(yr, mon, day, countunit, decimals, rounding) {

    // Starter Variables
    var today = new Date();
    yr = parseInt(yr);
    mon = parseInt(mon);
    day = parseInt(day);
    var one_day = 1000 * 60 * 60 * 24;
    var one_month = 1000 * 60 * 60 * 24 * 30;
    var one_year = 1000 * 60 * 60 * 24 * 30 * 12;
    var pastdate = new Date(yr, mon - 1, day);
    var return_value = 0;

    var finalunit = (countunit == "days") ? one_day : (countunit == "months") ? one_month : one_year;
    decimals = (decimals <= 0) ? 1 : decimals * 10;

    if (countunit != "years") {
        if (rounding == "rounddown")
            return_value = Math.floor((today.getTime() - pastdate.getTime()) / (finalunit) * decimals) / decimals;
        else
            return_value = Math.ceil((today.getTime() - pastdate.getTime()) / (finalunit) * decimals) / decimals;
    } else {
        var yearspast = today.getFullYear() - yr - 1;
        var tail = (today.getMonth() > mon - 1 || today.getMonth() == mon - 1 && today.getDate() >= day) ? 1 : 0;
        return_value = yearspast + tail;
    }

    return return_value;

}
exports.birthday2Age = function birthday2Age(birthday) {
    var d = moment(birthday);
    var tody = moment();
    // var pastdate=d.subtract(1,'months');
    var return_value = 0;

    return_value = tody.diff(d, 'years');
    return return_value;


}

exports.isWeixin = function is_weixn(userAgent) {
    var ua = userAgent.toLowerCase();
    if (ua.match(/MicroMessenger/i) == "micromessenger") {
        return true;
    } else {
        return false;
    }
}