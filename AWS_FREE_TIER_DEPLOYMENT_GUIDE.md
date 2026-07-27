# Guía de Despliegue en AWS — Capa Gratuita (AWS Free Tier)

Esta guía detalla los pasos exactos para desplegar **Kiro Code Lab** en Amazon Web Services (AWS) de forma **100% Gratuita** utilizando la capa gratuita de AWS EC2 (750 horas al mes en instancias t2.micro / t3.micro).

---

## Requisitos Previos

1. Una cuenta activa en [AWS Console](https://aws.amazon.com/es/).
2. El repositorio del proyecto subido a GitHub: `https://github.com/Riki-Avi/kirotest.git`

---

## Paso 1: Crear la Instancia EC2 Gratuita

1. Iniciar sesión en AWS Management Console y buscar el servicio **EC2**.
2. Hacer clic en **Lanzar una instancia** (*Launch Instance*).
3. Configurar los parámetros básicos:
   - **Nombre**: `kiro-code-lab-server`
   - **Sistema Operativo (AMI)**: Ubuntu Server 24.04 LTS (Asegurarse de que tenga la etiqueta *Free tier eligible* / Elegible para la capa gratuita).
   - **Tipo de instancia**: `t2.micro` (o `t3.micro` según disponibilidad en tu región).
4. **Par de llaves (Key Pair)**:
   - Hacer clic en *Crear nuevo par de llaves*.
   - Nombre: `kiro-aws-key`
   - Descargar el archivo `.pem` y guardarlo en un lugar seguro de tu computadora.
5. **Configuración de Red (Security Group)**:
   - Marcar las siguientes casillas:
     - Permitir tráfico SSH (Puerto 22) desde cualquier lugar (`0.0.0.0/0`).
     - Permitir tráfico HTTP (Puerto 80) desde internet.
     - Permitir tráfico HTTPS (Puerto 443) desde internet.
6. Hacer clic en **Lanzar Instancia**.

---

## Paso 2: Conectarse al Servidor por SSH e Instalar Docker

Desde una terminal en tu computadora (donde descargaste `kiro-aws-key.pem`):

1. Dar permisos adecuados a la llave SSH (en Linux/macOS o PowerShell):
```bash
chmod 400 kiro-aws-key.pem
```

2. Conectarse al servidor reemplazando `IP_PUBLICA_EC2` por la IP que muestra AWS:
```bash
ssh -i kiro-aws-key.pem ubuntu@IP_PUBLICA_EC2
```

3. Dentro de la instancia EC2, ejecutar los siguientes comandos para instalar Docker y Git:
```bash
sudo apt update && sudo apt install -y docker.io git
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ubuntu
newgrp docker
```

---

## Paso 3: Clonar el Repositorio y Compilar el Contenedor

1. Clonar el repositorio oficial:
```bash
git clone https://github.com/Riki-Avi/kirotest.git
cd kirotest
```

2. Construir la imagen de producción con el Dockerfile:
```bash
docker build -t kiro-web -f Dockerfile .
```

3. Ejecutar el contenedor vinculando el puerto 80 del servidor al puerto 8080 de la aplicación:
```bash
docker run -d --name kiro-app --restart always -p 80:8080 -e ASPNETCORE_ENVIRONMENT=Production kiro-web
```

---

## Paso 4: Probar la Aplicación en Vivo

1. Copia la dirección **IPv4 pública** de tu instancia desde la consola de EC2.
2. Abre un navegador web e ingresa:
```
http://IP_PUBLICA_EC2
```

3. Tu aplicación Kiro Code Lab estará corriendo en vivo en AWS sin costo dentro de la capa gratuita.
