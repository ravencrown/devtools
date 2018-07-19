/**
 * @file swan's slave '.swan' file compiled runtime js
 * @author houyu(houyu01@baidu.com)
 */
(PageComponent => {
    <%-swanCustomComponentsCodeJson%>
    Object.assign(PageComponent.components, <%-swanCustomComponentsMapJson%>);
    class Index extends PageComponent {
        constructor(options) {
            super(options);
            this.components = PageComponent.components;
        }
        static template = `<swan-wrapper tabindex="-1"><%-swanContent%></swan-wrapper>`;
    }

    // 初始化页面对象
    const index = new Index();
    // 调用页面对象的加载完成通知
    index.slaveLoaded();
    // 监听等待initData，进行渲染
    index.communicator.onMessage('initData', params => {
        // 根据master传递的data，设定初始数据，并进行渲染
        index.setInitData(params);
        // 真正的页面渲染，发生在initData之后
        index.attach(document.body);
        // 打浏览器补丁
        browserPatch();
    });

    /**
     * 修复浏览器一些兼容问题
     */
    const browserPatch = () => {
        document.querySelector('swan-wrapper').addEventListener('touchmove', () => {});
    };

    index.slaveJsLog();
})(window.PageComponent);
