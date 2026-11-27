// Entorno de PRODUCCIÓN (ng build). Se usa en el despliegue distribuido (Escenario 2):
//   VM-BD       192.168.56.10  PostgreSQL 5432
//   VM-Backend  192.168.56.20  Apache Tomcat 11 :8080 -> sisco.war (contexto /sisco)
//   VM-Frontend 192.168.56.30  Apache HTTP Server :80 -> este build
// La URL de la API NO puede ser localhost: el navegador del usuario debe llegar al backend
// por la red. Si cambian las IP de las máquinas, actualizar HOST y volver a compilar.
// En desarrollo (ng serve) se usa environment.development.ts, que apunta a localhost:8080.
export const environment = {
    HOST: 'http://192.168.56.20:8080/sisco/api',
    // Client ID de Google Cloud (OAuth, Aplicación web). En la consola de Google se debe
    // agregar http://192.168.56.30 como origen autorizado para que el botón funcione.
    GOOGLE_CLIENT_ID: '101214051365-lblrf36bkjqnfu7nsc3r99sou4fbv6lf.apps.googleusercontent.com',
};
