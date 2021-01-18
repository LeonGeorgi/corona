type Config = {
  apiUrl: string
}

const prod: Config = {
  apiUrl: "/api"
}


const dev: Config = {
  apiUrl: "http://localhost:5000"
}

export const config = process.env.NODE_ENV === 'development' ?  dev : prod