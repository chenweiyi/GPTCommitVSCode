export function runTaskWithTimeout(task: () => void, timeout: number, interval: number) {
    const intr = setInterval(task, interval);

    const timer = setTimeout(() => {
        clearInterval(intr);
    }, timeout);

    return () => {
        clearInterval(intr);
        clearTimeout(timer);
    };
}