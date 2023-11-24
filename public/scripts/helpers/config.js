const mapButtonNormal = new Image();
mapButtonNormal.src = 'images/map/mapButtonNormal.png'; 

const mapButtonHover = new Image();
mapButtonHover.src = 'images/map/mapButtonHover.png';

const mapImage = new Image();
mapImage.src = 'images/map/mapImage.png'; 

const closeButton = new Image();
closeButton.src = 'images/map/closeMapButton.png'; // Replace with the actual path

const closeButtonHover = new Image()
closeButtonHover.src = 'images/map/closeMapButtonHover.png'; // Replace with the actual path

const config = {
    mapButtonWidth:  mapButtonNormal.width,
    mapButtonHeight:  mapButtonNormal.height,
    mapButtonNormal: mapButtonNormal,
    mapButtonHover: mapButtonHover,
    mapButtonDistanceFromTopAndLeft: 10,
    mapImage: mapImage,
    mapImageWidth: mapImage.width,
    mapImageHeight: mapImage.height,
    closeButton: closeButton,
    closeButtonHover: closeButtonHover,
    closeButtonWidthHeight: 20,
    closeButtonX: 610,
    closeButtonY: 85,


    baseX: 800,
    baseY: 500,
    resizeX: 1600,
    resizeY: 1000,
};

export default config;