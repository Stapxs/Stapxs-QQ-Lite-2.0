window.createMap = function (key, msgId, point) {
    if (key == undefined || point == undefined) return

    AMapLoader.load({
        key: key,
        version: "2.0",
    }).then((AMap) => {
        const map = new AMap.Map('map-' + msgId, {
            viewMode: '2D',
            zoom: 15,
            center: [point.lng, point.lat]
        });
        const marker = new AMap.Marker({
            position: [point.lng, point.lat]
        })
        map.add(marker)
    }).catch((e) => {
        throw e
    })
}