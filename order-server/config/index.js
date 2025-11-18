import dotenv from "dotenv";

if(process.env.NODE_ENV !== 'prod'){
    const configFile = `./.env.${process.env.NODE_ENV}`;
    console.log('configFile : ',configFile)
    dotenv.config({path:configFile.trim()})
}else{
    dotenv.config({path:'./.env'})
}

const PORT = process.env.PORT || 3000;

export default PORT;
