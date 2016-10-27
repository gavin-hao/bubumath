require('./images/beijing.png');
require('./images/anniu.png');
require('./images/line.png');
require('./images/shiyi.png');
require('./images/zhu1.png');
require('./images/zhu2.png');
require('./images/bubutuo.png');
require('./stylesheets/wx.css');

require('./stylesheets/radio.css');
function notification(type, text) {

    //autoClose = autoClose == undefined ? true : autoClose;
    var container = $('.noty_container');
    var opt = {
        text: text,
        type: type,
        dismissQueue: false,
        layout: 'top',
        theme: 'defaultTheme',
        maxVisible: 1,
    };
    var n;
    if (container.length > 0) {
        n = container.noty(opt);
    } else {
        n = noty(opt);
    }
    n.setTimeout(10000);
    //if (autoClose) {
    //    setTimeout(function () {
    //        $.noty.close(n.options.id);
    //    }, 3000);
    //}
    //console.log(type + ' - ' + n.options.id);
    return n;
}
$.validator.addMethod("mobileCN", function (value, element) {
    return this.optional(element) || /^(\+?0?86\-?)?1[345789]\d{9}$/.test(value);
}, "请输入正确的手机号");
$.validator.addMethod("isusername", function (value, element) {
    return this.optional(element) || /^[\u4e00-\u9fa5_a-zA-Z0-9]+$/i.test(value);
}, "只能包含中文,英文字母,下划线 _");

function ajaxSubmitHandler(form) {
    var btnSubmit = $(form).find(":submit"); //$(cur_validator.submitButton); //
    $(form).ajaxSubmit({
        beforeSend: function (data) {
            btnSubmit.prop("disabled", true);
        },
        complete: function () {
            btnSubmit.removeProp("disabled");
        },
        success: function (data) {
            //console.log(data);
            btnSubmit.trigger('as.ajax.completed', data, btnSubmit);

        },
        error: function (data) {
            //console.log(data);
            btnSubmit.trigger('as.ajax.error', data, btnSubmit);
        }
    });
    return false;
}

function initValidateForms() {
    var forms = $('form[data-validate]');
    if (forms) {
        $(forms).each(function () {
            var $thisform = $(this);
            $(this).validate({
                submitHandler: $thisform.data('ajax') == false ? function (form) {
                    $(form).find(":submit").prop("disabled", true);
                    form.submit();
                } : ajaxSubmitHandler,
                errorElement: "span",
                errorPlacement: function (error, element) {
                    // Add the `help-block` class to the error element
                    error.addClass("help-block");
                    if (element.prop("type") === "checkbox") {
                        error.insertAfter(element.parent("label"));
                    } else {
                        element.parent().find('.help-block').remove();
                        error.insertAfter(element);
                    }
                },
                highlight: function (element, errorClass, validClass) {
                    $(element).parents(".form-group").addClass("has-error").removeClass("has-success");
                },
                unhighlight: function (element, errorClass, validClass) {
                    $(element).parents(".form-group").addClass("has-success").removeClass("has-error");
                }
            });
        });
    }
}
var ManagedMessage = {
    "Incorrect password or email.": "邮箱或密码错误",
    "Incorrect password.": "密码错误",
    "UserName already taken": "用户名已存在",
    "PhoneNumber already taken": "该电话已存在",
    "Email already taken": "该邮箱已存在",
    "Mobile phone number has already been taken":"此手机号已经被占用",
    "UserName has already been taken":"此账号已存在",
    "Nickname has already been taken": "该昵称已被占用",
    // "A user with that external login already exists.": "该帐号已绑定了其它帐号"
}
function registAjaxEvent() {
    function showErrorMessage(data) {
        data.message = (data.message || "出错了～");
        var msg = ManagedMessage[data.message] ? ManagedMessage[data.message] : data.message
        $('#error_summary').text(msg);
    }
    $(document).on('as.ajax.completed', function (e, data) {
        if (data.success) {
            //notification('alert', "保存成功");
            if (data.action) {
                switch (data.action) {
                    case "redirect":
                        window.location.href = data.redirect_uri;
                        break;
                    default:
                        window.location.href = window.location.href;
                        break;
                }
            } else {
                notification('success','保存成功');

            }
        }
        else {

            var $src = $(e.target);
            switch ($src.attr('name')) {
                case "bind_wechat":
                    switch (data.action) {
                        case "redirect":
                            window.location.href = data.redirect_uri;
                            break;
                        case "reload":
                            window.location.href = window.location.href;
                            break;
                    }
                    notification('error', msg);
                    break;
                default:
                    var msg = ManagedMessage[data.message] ? ManagedMessage[data.message] : data.message;
                    console.log(msg);
                    notification('error', msg);
                    break;

            }
        }

    });
    $(document).on('as.ajax.error', function (e, data) {
        if (data&&data.status > 400 && data.status < 404) {
            //authenticate error, need login
            window.location.href = window.location.href;
        } else {
            data.message = (data.message || "出错了～");
            var msg = ManagedMessage[data.message] ? ManagedMessage[data.message] : data.message;
            notification('error', msg);
            // $('#error_summary').text(msg);
        }
    })

}

(function run() {
    initValidateForms();
    registAjaxEvent();
})()