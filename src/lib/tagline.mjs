const taglines = [
    'Slicing through code one line at a time.',
    'The ninja stars of coding students.',
    'Coding with a sharp edge.',
    'From the dojo of coding ninjas.',
    'Sneaking up on bugs so they don\'t know what hit them.',
];

export function getTagline() {
    const idx = Math.floor(Math.random() * taglines.length);
    return taglines[idx];
}