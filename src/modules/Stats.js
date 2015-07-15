/**
 * Created by kevin on 15-7-10.
 */
var util = require('./Util');
var mean = require('compute-mean');
var variance = require('compute-variance');
var normDist = require('distributions-normal');
var exponDist = require('distributions-exponential');

//分布
var Fx = (function () {
    var ret = {};
    //正态分布
    ret.norm = normDist();
    //指数分布
    ret.expon = exponDist();
    return ret;
})();

var ksTest = function (arr, type) {
    type = type || 'norm';
    if (['norm', 'expon'].indexOf(type) == -1)return;
    arr = arr.sort(function (a, b) {
        return a - b;
    });
    var ret = {};
    var u = mean(arr);
    var cdf = null;
    var n = arr.length;
    if (type == 'expon') {
        u = 1 / u;
        ret.rate = u;
        cdf = Fx.expon.rate(u).cdf(arr);
    } else {
        var v = variance(arr, {'bias': true});
        ret.aver = u;
        ret.stdd = Math.sqrt(v);
        ret.invFunc = normDist().inv();
        cdf = Fx.norm.mean(u).variance(v).cdf(arr);
    }
    var DPlus = 0, DMin = 0;
    for (var i = 0; i < n; i++) {
        DPlus = Math.max(DPlus, (i + 1) / n - cdf[i]);
        DMin = Math.max(DMin, cdf[i] - i / n);
    }
    ret.D = Math.max(DPlus, DMin);//two side
    ret.p = pValue(n, ret.D);
    return ret;
}

exports.ksTest = ksTest;
exports.arrAdd = function (arr, start, end) {
    start = start || 0;
    end = end || arr.length;
    var ret = 0;
    for (var i = start; i < end; i++) {
        ret += arr[i];
    }
    return ret;
}
exports.arrMul = function (arr, start, end) {
    start = start || 0;
    end = end || arr.length;
    var ret = 1;
    for (var i = start; i < end; i++) {
        ret *= arr[i];
    }
    return ret;
}
var pValue = function (n, D) {
    /**
     * Cal p-value of D. reference: http://emuch.net/html/201312/6746894.html
     * @param {number} n - size of sample
     * @param {number} D - D D- or D+
     * @return p-value
     */
    //return Math.exp(-2 * n * D * D);
    var s = n * D * D;
    return 2 * Math.exp(-(2.000071 + 0.331 / Math.sqrt(n) + 1.409 / n) * s);
}
//var x = [0.41442977, 0.11531602, 1.53136872, 0.73404083, 0.97077522,
//    0.33306947, 1.0498035, 1.26137494, 0.74030039, 1.37439513];
//console.log(ksTest(x));
////console.log(pValue(10, 0.52104191663072319));