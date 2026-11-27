// Entorno del despliegue en contenedores (Escenario 4, Docker):  ng build --configuration docker
//   sisco-frontend  AlmaLinux 9 + Apache httpd  → http://localhost:8081  (este build)
//   sisco-backend   Ubuntu 24.04 + Tomcat 11    → http://localhost:8080/sisco (sisco.war)
//   sisco-bd        Rocky Linux 9 + PostgreSQL  → solo red interna de Docker
// El navegador del usuario llama al backend por el puerto publicado en el anfitrión.
export const environment = {
    HOST: 'http://localhost:8080/sisco/api',
    // Client ID de Google Cloud (OAuth). Para usar el botón de Google se debe agregar
    // http://localhost:8081 como origen autorizado en la consola de Google.
    GOOGLE_CLIENT_ID: '101214051365-lblrf36bkjqnfu7nsc3r99sou4fbv6lf.apps.googleusercontent.com',
};
