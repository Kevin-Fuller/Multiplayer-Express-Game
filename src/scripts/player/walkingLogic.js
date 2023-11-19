// walkingLogic.js

function calculateAngle(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
}

function handleMove(socket, targetPosition, rooms, io) {
    const roomsArray = Array.from(socket.rooms);
    const room = roomsArray.length > 1 ? roomsArray[1] : undefined;

    if (room && rooms[room] && rooms[room][socket.id]) {
        const user = rooms[room][socket.id];

        user.state = "walking";

        // Calculate the distance between current and target position
        const deltaX = targetPosition.x - user.x;
        const deltaY = targetPosition.y - user.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        console.log(distance);
        console.log(`start position: ${user.x}`);

        // Set the distance scale for animation duration (e.g., 200 pixels per second)
        const distanceScale = 200;

        // Calculate the animation duration based on distance
        const animationDuration = distance / distanceScale;
        console.log(animationDuration);

        // Calculate the total steps based on duration and tick rate
        const totalSteps = Math.floor(animationDuration * 60);
        console.log(totalSteps);

        // Set the target position for animation
        user.animationTarget = targetPosition;

        // Set the total steps and step interval for animation
        user.animationTotalSteps = totalSteps;

        // Reset the current step
        user.animationCurrentStep = 0;

        // Calculate the angle between current and target position
        const angle = calculateAngle(user.x, user.y, targetPosition.x, targetPosition.y);

        // Convert the angle to one of the eight directions
        const directions = ["left", "up-left", "up", "up-right", "right", "down-right", "down", "down-left"];
        const index = Math.round((angle + Math.PI) / (Math.PI / 4)) % 8;
        const direction = directions[index];

        user.animationDirection = direction;

        // Used to calculate the total distance moved per step in the animation.
        user.deltaX = (user.animationTarget.x - user.x) / user.animationTotalSteps;
        user.deltaY = (user.animationTarget.y - user.y) / user.animationTotalSteps;
    }
}

module.exports = { calculateAngle, handleMove };
