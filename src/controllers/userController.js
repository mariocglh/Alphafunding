// src/controllers/userController.js
const prisma = require('../config/db');

exports.updateProfile = async (req, res) => {
    try {
        const { userId, firstName, lastName, email, password } = req.body;
        
        // 1. Seguridad: Verificar que el usuario que pide el cambio es el dueño de la cuenta
        if (req.user.userId !== userId) {
            return res.status(403).json({ error: "No tienes permiso para editar este perfil" });
        }

        // 2. Preparamos los datos a actualizar
        const updateData = { 
            firstName, 
            lastName, 
            email 
        };
        
        // 3. Si el usuario escribió una nueva contraseña, la añadimos al cambio
        // (Nota: En producción, aquí deberías encriptarla con bcrypt)
        if (password && password.trim() !== "") {
            updateData.password = password; 
        }

        // 4. Actualizamos en la Base de Datos
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData
        });

        res.json({ 
            message: "Perfil actualizado correctamente", 
            user: { 
                name: `${updatedUser.firstName} ${updatedUser.lastName}`, 
                email: updatedUser.email 
            } 
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Error al actualizar perfil (puede que el email ya exista)" });
    }
};