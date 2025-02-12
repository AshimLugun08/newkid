// data-sharing.ts

export const sharedData = {
    message: "",
};

export function setMessage(message: string) {
    sharedData.message = message;
}

export function getMessage() {
    return sharedData.message;
}
