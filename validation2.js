function Validator(formSelector) {
    const _this = this;

    let formRules = {};

    const getParent = (element, selector) => {
        while (element.parentElement) {
            if (element.parentElement.matches(selector)) {
                return element.parentElement;
            }
            element = element.parentElement;
        }
    };

    /*
     *Quy ước tạo rule:
     *- Nếu có lỗi thì return `error message`
     *- Nếu không có lỗi thì return `undefined`
     */
    const validatorRules = {
        required: (value) => {
            return value ? undefined : 'Vui lòng nhập trường này';
        },
        email: (value) => {
            const regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

            return regex.test(value) ? undefined : 'Vui lòng nhập email';
        },
        min: (min) => {
            return (value) => {
                return value.length >= min
                    ? undefined
                    : `Vui lòng nhập ít nhất ${min} ký tự`;
            };
        },
        max: (max) => {
            return (value) => {
                return value.length <= max
                    ? undefined
                    : `Vui lòng nhập tối đa ${max} ký tự`;
            };
        },
    };

    //Lấy form element
    const formElement = document.querySelector(formSelector);

    //Chỉ xử lý khi có element trong DOM
    if (formElement) {
        const inputs = formElement.querySelectorAll('[name][rules]');

        for (let input of inputs) {
            const rules = input.getAttribute('rules').split('|');

            for (let rule of rules) {
                let ruleInfo;
                const isRuleHasValue = rule.includes(':');

                if (isRuleHasValue) {
                    ruleInfo = rule.split(':');

                    rule = ruleInfo[0];
                }

                let ruleFunc = validatorRules[rule];

                if (isRuleHasValue) {
                    ruleFunc = ruleFunc(ruleInfo[1]);
                }

                if (Array.isArray(formRules[input.name])) {
                    formRules[input.name].push(ruleFunc);
                } else {
                    formRules[input.name] = [ruleFunc];
                }
            }

            //Lắng nghe sự kiện validate (blur, change, ...)
            input.onblur = handleValiedate;
            input.oninput = handleClearError;
        }

        //Hàm thực hiện sự kiện
        function handleValiedate(e) {
            const rules = formRules[e.target.name];
            let errorMessage;

            for (let rule of rules) {
                errorMessage = rule(e.target.value);

                if (errorMessage) break;
            }

            //Nếu có lỗi thì hiển thị message ra ui
            if (errorMessage) {
                const formGroup = getParent(e.target, '.form-group');
                if (formGroup) {
                    const formMessage =
                        formGroup.querySelector('.form-message');

                    formGroup.classList.add('invalid');

                    if (formMessage) {
                        formMessage.innerText = errorMessage;
                    }
                }
            }

            return !errorMessage;
        }
        //Hàm clear message lỗi
        function handleClearError(e) {
            const formGroup = getParent(e.target, '.form-group');

            if (formGroup.classList.contains('invalid')) {
                const formMessage = formGroup.querySelector('.form-message');

                formGroup.classList.remove('invalid');

                if (formMessage) {
                    formMessage.innerText = '';
                }
            }
        }
    }

    //Xử lý submit form
    formElement.onsubmit = (e) => {
        e.preventDefault();

        const inputs = formElement.querySelectorAll('[name][rules]');
        let isValid = true;

        for (let input of inputs) {
            if (!handleValiedate({ target: input })) {
                isValid = false;
            }
        }

        //Khi ko có lỗi thì submit form

        if (isValid) {
            if (typeof _this.onSubmit === 'function') {
                const enabledInput = formElement.querySelectorAll('[name]');

                const formValues = Array.from(enabledInput).reduce(
                    (values, input) => {
                        switch (input.type) {
                            case 'radio':
                                values[input.name] = formElement.querySelector(
                                    `input[name= "${input.name}"]:checked`
                                ).value;
                                break;
                            case 'checkbox':
                                if (!input.matches(':checked')) {
                                    //BUG CHECKBOX
                                    // values[input.name] = '';
                                    return values;
                                }

                                if (!Array.isArray(values[input.name])) {
                                    values[input.name] = [];
                                }
                                values[input.name].push(input.value);
                                break;
                            // case 'file':
                            //     values[input.name] = input.files;
                            //     break;
                            default:
                                values[input.name] = input.value;
                        }

                        return values;
                    },
                    {}
                );
                //Gọi lại hàm onsubmit và trả về giá trị input c form
                _this.onSubmit(formValues);
            } else {
                formElement.submit();
            }
        }
    };
}
