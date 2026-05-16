# Legacy Appointment Schema

```javascript
const mongoose = require("mongoose");
const { Schema } = mongoose;

const AppointmentSchema = new Schema(
{
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },

    doctorName: {
        type: String,
        required: true
    },

    department: {
        type: String,
        required: true
    },

    appointmentDate: {
        type: Date,
        required: true
    },

    appointmentStatus: {
        type: String,
        required: true
    }

},
{
    timestamps: true
});

module.exports = mongoose.model("Appointment", AppointmentSchema);
```