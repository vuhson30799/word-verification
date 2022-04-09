
const colors = ['#1943e0', '#d02797', '#f2da17', '#17f243', '#cc80f2', '#cdab4e']
export function getRandomColor() {
    const index = Math.floor(Math.random() * colors.length);
    return colors[index]
}
