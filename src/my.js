/**
 * Created by kevin on 15-6-30.
 */
var gui = require('nw.gui');
var win = gui.Window.get();
var util = require('./lib/Util');
var stats = require('./lib/Stats');
$(document).foundation();
const TEST = false;

function createDOM(name, opts, inner) {
    var dom = document.createElement(name);
    for (var key in opts) {
        dom.setAttribute(key, opts[key]);
    }
    if (typeof inner !== 'undefined') {
        dom.innerHTML = inner;
    }
    return dom;
}
var $n = $('#n');
var $L = $('#L');
//var $aver = $('#aver');
//var $stdd = $('#stdd');
//var $rate = $('#rate');
String.prototype.toNumber = function () {
    var x = Number(this);
    if (x == 0 && !util.isNumber(this))return NaN;
    return x;
}
var $ig = $('.in-group');
var dataModel = function (n, L, form) {
    this.n = n;
    this.L = L;
    this.form = [];
}
var data;
/*
 指数分布数据
 0.00968069 0.64060998 1.72136687 2.09658888 4.37427201 0.30821838 0.43159346 0.34941722 0.82613796 0.7093381
 正态分布数据
 6 7 8 7 7 8
 3 4 5 4 3 5
 7 6 8 8 7 8
 4 5 6 4 5 5
 */
dataModel.prototype.analyze = function () {
    var n = this.n;
    var L = this.L;
    var eps = 0.05;
    var B1Array = [];
    var B2Array = [];
    for (var i = 0; i < n; i++) {
        terminal.writeTitle('第' + (1 + i) + '相位');
        var f = this.form[i];
        var al = new algorithms(f);
        terminal.writeLine('Start Single-Sample Kolmogorov-Smirnov Test...  Let α = 0.5');
        var res1 = stats.ksTest(f.v, 'norm');
        var res2 = stats.ksTest(f.v, 'expon');
        terminal.writeLine('正态分布检验 - D: ' + res1.D.toFixed(4) + '  P-Value: ' + res1.p.toFixed(4));
        terminal.writeLine('指数分布检验 - D: ' + res2.D.toFixed(4) + '  P-Value: ' + res2.p.toFixed(4));
        if (Math.max(res1.p, res2.p) - 0.5 + eps <= 0) {
            //两者皆不符合
            terminal.writeError('到达率既不符合正态分布也不符合指数分布');
            return;
        }
        var b1, b2;
        if (res1.p >= res2.p) {
            //正态分布
            terminal.writeLine('到达率符合正态分布  ' +
                '均值μ = ' + res1.aver.toFixed(4) + ' 标准差σ = ' + res1.stdd.toFixed(4));
            b1 = al.norm1(res1.aver, res1.stdd, res1.invFunc);
            b2 = al.norm2(b1);
        } else {
            //指数分布
            terminal.writeLine('到达率符合指数分布  ' +
                '率参数λ = ' + res2.rate.toFixed(4));
            b1 = al.expon1(res2.rate);
            b2 = al.expon2(b1);
        }
        B1Array.push(b1);
        B2Array.push(b2);
        var bret = 'B' + '<sub>' + (i + 1) + '</sub>' + ' = ';
        bret += b2.map(function (val, index) {
            return val.toFixed(4) + '(X = ' + al.Xs[index] + ')';
        }).join(',');
        terminal.writeLine('1.相位清空可靠度算法B' + '<sub>' + (i + 1) + '</sub>' + ' = ' + b1.toFixed(4));
        terminal.writeLine('2.服务水平可靠度算法' + bret);
    }

    terminal.writeTitle('相位清空可靠度算法分析结果');
    var ret1 = this.calculate(B1Array);
    terminal.writeLine('C = ' + ret1.C.toFixed(4));
    terminal.writeLine('g[array] = ' + ret1.gs.map(function (s) {
            return s.toFixed(4)
        }));
    terminal.writeTitle('服务水平可靠度算法分析结果');
    for (var j = 0; j < al.Xs.length; j++) {
        terminal.writeLine('当X = ' + al.Xs[j] + '时');
        var ret2 = this.calculate(B2Array.map(function (v) {
            return v[j];
        }));
        terminal.writeLine('C = ' + ret2.C.toFixed(4));
        terminal.writeLine('g[array] = ' + ret2.gs.map(function (s) {
                return s.toFixed(4)
            }));
    }
}
dataModel.prototype.calculate = function (Bs) {
    var n = this.n, L = this.L, As = this.form.map(function (o) {
        return o.A;
    });
    var gs = [], BsToT = stats.arrMul(Bs), _Bs = new Array(n);
    for (var i = 0; i < n; i++) {
        _Bs[i] = BsToT / Bs[i];
    }
    gs.push((L + stats.arrAdd(As)) * _Bs[0] / (BsToT - stats.arrAdd(_Bs)));
    if (TEST) {
        console.log('gs[0]', L, stats.arrAdd(As), BsToT, stats.arrAdd(_Bs));
    }
    for (var i = 1, C = gs[0] * Bs[0]; i < n; i++) {
        gs.push(C / Bs[i]);
    }
    return {
        C: C,
        gs: gs
    }
}
var algorithms = function (f) {
    this.s = f.s;
    this.a = f.a;
}
algorithms.prototype.Xs = [0.5, 0.7, 0.85];
//正态分布相位清空可靠度算法
algorithms.prototype.norm1 = function (aver, stdd, inv) {
    return this.s / (aver + stdd * inv(this.a));
}

//正态分布服务水平可靠度算法
algorithms.prototype.norm2 = function (tmp) {
    tmp = tmp || this.norm1.apply(this, Array.prototype.slice.call(arguments, 1));
    return this.Xs.map(function (x) {
        return x * tmp;
    });
}

//指数分布相位清空可靠度算法
algorithms.prototype.expon1 = function (rate) {
    return (-rate * this.s) / Math.log(1 - this.a);
}

//指数分布服务水平可靠度算法
algorithms.prototype.expon2 = function (tmp) {
    tmp = tmp || this.expon1.apply(this, Array.prototype.slice.call(arguments, 1));
    return this.prototype.Xs.map(function (x) {
        return x * tmp;
    });
}
$L.keydown(function (e) {
    if (e.which == 13) {
        $n.focus();
    }
});

$n.keydown(function (e) {
    if (e.which == 13) {
        next();
    }
});
var switchTab = (function () {
    var current = 0;
    var $tab1 = $('#tab1');
    var $tab2 = $('#tab2');
    return function (index) {
        index = index || current ^ 1;
        if (current == index || index < 0 || index > 1)return;
        if (index == 1) {
            $tab1.hide();
            $tab2.fadeIn();
        } else {
            $tab2.hide();
            $tab1.fadeIn();
        }
        current ^= 1;
    }
})();
var next = function () {
    var n = $n.val().toNumber();
    var L = $L.val().toNumber();
    if (!util.isNaN(n - L)) {
        data = new dataModel(n, L);
        pagination.init();
        switchTab(1);
    } else {
        terminal.writeError('Invalid Params');
    }
}
var submit = function () {
    if (TEST) {
        data = new dataModel(4, 12);
        data.form = [
            {a: 0.8, s: 30 / 60, A: 3, v: [6 / 60, 7 / 60, 8 / 60, 7 / 60, 7 / 60, 8 / 60]},
            {a: 0.8, s: 30 / 60, A: 3, v: [3 / 60, 4 / 60, 5 / 60, 4 / 60, 3 / 60, 5 / 60]},
            {a: 0.8, s: 30 / 60, A: 3, v: [7 / 60, 6 / 60, 8 / 60, 8 / 60, 7 / 60, 8 / 60]},
            {a: 0.8, s: 30 / 60, A: 3, v: [4 / 60, 5 / 60, 6 / 60, 4 / 60, 5 / 60, 5 / 60]}
        ]
        data.analyze();
        return;
    }
    if (!data.n) {
        terminal.writeError('Invalid Params');
        return;
    }
    data.form = pagination.getForm();
    if (!data.form) {
        terminal.writeError('Invalid Params');
        return;
    }
    data.analyze();
}

var pagination = (function () {
    var ret = {};
    var p = $('ul.pagination');
    var total, current, liArray, formArray;
    var createPage = function (content, isActive) {
        var opts = {};
        if (isActive) opts.class = 'current';
        var li = createDOM('li', opts);
        li.appendChild(createDOM('a', null, content));
        return li;
    }

    function formModel(a, s, A, v) {
        this.a = a || '';
        this.s = s || '';
        this.A = A || '';
        this.v = v || '';
    }

    formModel.prototype.set = function () {
        util.each(this, function (key, val) {
            $ig.find('#' + key).val(val);
        });
    }
    formModel.prototype.get = function () {
        var ret = {};
        var f = util.each(this, function (key, val) {
            if (key == 'v') {
                ret.v = val.split(' ').map(function (s) {
                    return s.toNumber() / 60;//单位转换pcu/min -> pcu/s
                }).filter(function (x) {
                    return x < 0 ? false : util.isNaN(x) ? false : true;
                });
                if (ret.v.length == 0)return false;
            } else {
                ret[key] = val.toNumber();
                if (util.isNaN(ret[key]))return false;
                if (key == 's')ret[key] /= 60;//单位转换pcu/min -> pcu/s
            }
        });
        return f ? ret : null;
    }

    var addListener = function () {
        p.on('click', 'li', function () {
            var targetIndex = liArray.indexOf(this);
            if (targetIndex == 0) {
                // backward
                targetIndex = current - 1;
            } else if (targetIndex == total + 1) {
                // forward
                targetIndex = current + 1;
            }
            if (targetIndex == current || targetIndex > total || targetIndex < 1)return;
            liArray[current].className = '';
            liArray[targetIndex].className = 'current';
            current = targetIndex;
            $ig.fadeOut(100, function () {
                $ig.find('label').text('第' + current + '相位');
                formArray[current - 1].set();
                $ig.fadeIn();
            });
            if (current == 1) {
                liArray[0].className = 'arrow unavailable';
            } else {
                liArray[0].className = 'arrow';
            }
            if (current == total) {
                liArray[total + 1].className = 'arrow unavailable';
            } else {
                liArray[total + 1].className = 'arrow';
            }
        });

        $ig.on('change', 'input,textarea', function () {
            formArray[current - 1][this.id] = this.value;
        });
    }
    ret.init = function () {
        p.empty();
        current = 1;
        $ig.find('label').text('第' + current + '相位');
        liArray = [];
        formArray = [];
        total = data.n;
        $ig.find('input,textarea').val('');
        for (var i = 0, li; i <= 1 + total; i++) {
            if (i == 0) {
                li = createDOM('li', {class: 'arrow unavailable'});
                li.appendChild(createDOM('a', null, '&laquo;'));
            } else if (i == total + 1) {
                li = createDOM('li', {class: 'arrow'});
                if (total == 1)li.className = 'arrow unavailable';
                li.appendChild(createDOM('a', null, '&raquo;'));
            } else {
                formArray.push(new formModel());
                li = createPage(i, i == current);
            }
            liArray.push(li);
            p.append(li);
        }
        addListener();
    }
    ret.getForm = function () {
        var res = [];
        for (var i = 0, tmp; i < formArray.length; i++) {
            tmp = formArray[i].get();
            if (!tmp)return null;
            res.push(tmp);
        }
        return res;
    }
    return ret;
})();

var terminal = (function () {
    var ret = {};
    var tl = $('.terminal');
    var createLine = function (msg) {
        var li = createDOM('li');
        var span = createDOM('span');
        var cover = createDOM('div', {class: 'cover'});
        span.appendChild(createDOM('span', {class: 'txt'}, msg));
        span.appendChild(cover);
        li.appendChild(span);
        return {
            li: li,
            cover: $(cover)
        };
    }

    var playing = false;
    var Q = new util.queue();
    ret.writeLine = function (msg) {
        Q.push(createLine(msg));
        if (playing == false) {
            tl.find('li').last().remove();
            tl.append(Q.front().li);
            requestAnimationFrame(animate);
        }
    }
    ret.writeError = function (msg) {
        ret.writeLine('<span class="tl-err">[Error]</span> ' + msg);
    }
    ret.writeTitle = function (msg) {
        ret.writeLine('<span class="tl-title">' + msg + '</span>');
    }
    var animate = function () {
        if (Q.empty())return;
        var w = Q.front().cover.width();
        if (w > 0) {
            Q.front().cover.width(w - 5);
            playing = true;
            requestAnimationFrame(animate);
        } else {
            Q.pop();
            if (!Q.empty()) {
                tl.append(Q.front().li);
                requestAnimationFrame(animate);
            } else {
                playing = false;
                tl.append(createLine('').li);
            }
        }
    }

    ret.init = function () {
        ret.writeLine('Welcome to traffic signal control system...');
    }
    return ret;
})();
terminal.init();
if (TEST) {
    switchTab(1);
    submit();
}

