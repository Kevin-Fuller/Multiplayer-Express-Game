
function convertToResize(x, y) {
    const xRatio = resizeX / baseX;
    const yRatio = resizeY / baseY;

    const resizeXPos = x * xRatio;
    const resizeYPos = y * yRatio;

    return { x: resizeXPos, y: resizeYPos };
}


function convertToResize(x, y) {
    const xRatio = resizeX / baseX;
    const yRatio = resizeY / baseY;

    const resizeXPos = x * xRatio;
    const resizeYPos = y * yRatio;

    return { x: resizeXPos, y: resizeYPos };
}

function convertToBase(x, y) {
    const xRatio = resizeX / baseX;
    const yRatio = resizeY / baseY;

    const baseXPos = x / xRatio;
    const baseYPos = y / yRatio;

    return { x: baseXPos, y: baseYPos };
}

export {convertToResize, convertToResize, convertToBase}