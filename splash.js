const splashes = [
    ["Don't let the Synaptic write the Backend", "#f88c00"],
];

const splash = splashes[Math.floor(Math.random() * splashes.length)];
let splashtxt="";
let spaces=((62-splash[0].length)/2);
if (spaces%2!=0)
    spaces+=1;
for (let i=1; i<spaces; i+=1 )
    splashtxt+=" "
export const splashtext=splashtxt+splash[0]+`\n`;
export const splashcolor = splash[1];

//sophie? put splash text in things? impossible