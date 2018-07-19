/**
 * @file native input
 * @author bailonggang
 * 2018/5/18
 */

module.exports = function showNativeInput(ipcRenderer, data) {
    let inputParams = JSON.parse(data.query.params);
    let {id, cb, maxLength, type, value, password, cursor, placeholder} = inputParams;

    let swanDom = document.getElementById(id);
    if (!swanDom) {
        swanDom = document.querySelector(`[data-san_id="${id}"]`);
    }
    let inputContainer;
    let inputDom;

    for (let i = 0; i < swanDom.children.length; i++) {
        if (swanDom.children[i].id === 'swan-input-mock-ide-0316') {
            // Prevent create repeatly.
            inputContainer = swanDom.children[i];
            inputDom = inputContainer.children[0];
            value = inputDom.value;
        } else {
            swanDom.children[i].style.display = 'none';
        }
    }

    if (!inputContainer) {
        const style = parseStyle(inputParams);
        inputContainer = document.createElement('div');

        let inputContainerStyle = `
            background: transparent;position: relative;
            margin-top:-5px;margin-left:-15px;
            ${style.inputMockContainerStyle};
        `;
        inputContainer.setAttribute('id', 'swan-input-mock-ide-0316');
        inputContainer.setAttribute('style', inputContainerStyle);
        swanDom.appendChild(inputContainer);

        inputDom = document.createElement('input');
        if (password === '1') {
            inputDom.setAttribute('type', 'password');
        } else if (type === 'password' || type === 'button') {
            // windows上有对部分type不兼容, 大部分设置为text
            inputDom.setAttribute('type', type);
        } else {
            inputDom.setAttribute('type', 'text');
        }

        if (maxLength === '-1') {
            inputDom.setAttribute('maxlength', 1000000);
        } else {
            inputDom.setAttribute('maxlength', +maxLength);
        }

        let inputDomStyle = `
            position: absolute;border-width: 0;margin: 0;left: 0;top: 0;
            z-index: 1000;padding-top: 5px; padding-left: 15px;
            ${style.inputMockInputStyle};
        `;
        inputDom.setAttribute('id', 'swan-input-mock-ide-0316-inputDom');
        inputDom.setAttribute('style', inputDomStyle);
        inputDom.setAttribute('value', value);
        inputDom.setAttribute(
            'placeholder',
            placeholder === undefined ? '' : placeholder
        );
        addPlaceholderStyle(style.inputMockPlaceholderStyle);
        inputContainer.appendChild(inputDom);
    }

    setTimeout(() => {
        if (cursor !== '') {
            inputDom.setSelectionRange(+cursor, +cursor);
        } else {
            inputDom.setSelectionRange(value.length, value.length);
        }
        inputDom.focus();

        inputDom.onkeydown = function () {
            setTimeout(function () {
                let tempValue = inputDom.value;
                if (tempValue === '') {
                    setTimeout(() => {
                        swanDom.children[1].style.display = 'none';
                    }, 10);
                }
                inputCallback(cb, {
                    eventName: 'change',
                    value: tempValue,
                    cursorOffset: inputDom.selectionStart
                });
            }, 30);
        };

        inputDom.onblur = function () {
            let tempValue = inputDom.value;
            if (!!tempValue) {
                swanDom.children[0].style.display = '';
            } else {
                swanDom.children[1].style.display = '';
            }
            swanDom.removeChild(inputContainer);

            inputCallback(cb, {
                eventName: 'blur',
                value: tempValue
            });
        };
    }, 10);

    let args = Object.assign({}, data.query, {value: value});
    ipcRenderer.send('webview:event', {
        type: 'scheme.openInput',
        params: [args]
    });
};

function parseStyle(cacheInput) {
    let inputMockContainerStyle = '';
    let inputMockInputStyle = '';
    let inputMockPlaceholderStyle = '';

    const keysMap = {
        fontFamily: 'font-family',
        fontSize: 'font-size',
        fontWeight: 'font-weight',
        backgroundColor: 'background-color',
        textAlign: 'text-align',
        color: 'color'
    };

    let style = {};
    let keys = [];

    style = cacheInput.style;
    style.fontSize = style.fontSize + 'px';
    keys = Object.keys(style);
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        inputMockContainerStyle = inputMockContainerStyle + `;${keysMap[key]}:${style[key]}`;
    }

    style = cacheInput.placeholderStyle;
    style.fontSize = style.fontSize + 'px';
    keys = Object.keys(style);
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        inputMockPlaceholderStyle = inputMockPlaceholderStyle + `;${keysMap[key]}:${style[key]}`;
    }

    style = cacheInput.position;
    const temp = `;width: ${+style.width + 30}px;height: ${+style.height + 10}px;`;
    const tempInput = `;box-sizing: content-box;line-height: ${+style.height + 4}px;
        width: ${+style.width + 15}px;height: ${+style.height + 4}px;`;
    inputMockContainerStyle = `${inputMockContainerStyle}${temp}`;
    inputMockPlaceholderStyle = `${inputMockPlaceholderStyle}`;
    inputMockInputStyle = `${inputMockContainerStyle}${tempInput}`;

    return {
        inputMockContainerStyle,
        inputMockPlaceholderStyle,
        inputMockInputStyle
    };
}

function inputCallback(cb, data) {
    let callback = window[cb];
    callback && callback(JSON.stringify({
        status: 0,
        message: '调用成功',
        data: encodeURIComponent(JSON.stringify(data))
    }));
}

function addPlaceholderStyle(placeholderStyle) {
    let style = document.querySelector('#my-swan-ide-input');
    if (!style) {
        style = document.createElement('style');
        style.setAttribute('id', '#my-swan-ide-input');
        document.head.appendChild(style);
    }
    style.innerHTML = `#swan-input-mock-ide-0316-inputDom::-webkit-input-placeholder {${placeholderStyle}}`;
}
