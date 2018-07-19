/**
 * @file 拦截createMapContext, openLocation, getLocation
 * @author michealma
 */

function locationApi(api, {success, fail, complete}) {
    console.log(`开发者工具暂时不支持${api}, 请在百度App中调试该功能`);
    switch (api) {
        case 'createMapContext':
            return {
                getCenterLocation() {},
                moveToLocation() {},
                translateMarker() {},
                includePoints() {},
                getRegion() {},
                getScale() {}
            };
            break;
        case 'openLocation':
            return {};
            break;
        case 'chooseLocation':
            return {};
            break;
        case 'getLocation':
            // success && success({
            //     accuracy: 65,
            //     altitude: 0,
            //     horizontalAccuracy: 65,
            //     latitude: 39,
            //     longitude: 116,
            //     speed: -1,
            //     verticalAccuracy: 65
            // });
            // complete && complete();
            return {};
            break;
    }
}

module.exports = locationApi;
