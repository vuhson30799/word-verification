
const colors = ['#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#9bf6ff', '#a0c4ff','#bdb2ff', '#ffc6ff']
export function getRandomColor() {
    const index = Math.floor(Math.random() * colors.length);
    return colors[index]
}
