import nodemailer from "nodemailer";

export const enviarCredenciales = async (correo, nombre, contrasena) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "juanpaz1085@gmail.com",  // <-- cámbialo
        pass: "lbrf zltz demk hfkn",      // <-- NO tu contraseña normal (usa App Password)
      },
    });

    await transporter.sendMail({
      from: '"NodoRap" <juanpaz1085@gmail.com@gmail.com>',
      to: correo,
      subject: "Tus Credenciales para NodoRap",
      html: `
        <h2>Bienvenido/a ${nombre}</h2>
        <p>Estas son tus credenciales para ingresar a <b>NodoRap</b>:</p>
        <p><b>Correo:</b> ${correo}</p>
        <p><b>Contraseña:</b> ${contrasena}</p>

        <br/>
        <p>Por seguridad cambia tu contraseña cuando ingreses.</p>
      `,
    });

    console.log("Correo enviado correctamente a", correo);
  } catch (err) {
    console.error("Error enviando correo:", err);
  }
};
