import mongoose ,{Schema , Document} from "mongoose";
import {Course} from '@/types/course.types'

export interface CourseDocument extends Course, Document {}

const CourseSchema: Schema<CourseDocument> =  new Schema ({
    name: { type: String, required: true },
    marks: { type: Number, required: true },
    class_id: {
        type: Schema.Types.ObjectId,
        ref: "Classes",
        required: true,
    },
});

const CourseModel = mongoose.models.Course || mongoose.model<CourseDocument>("Course", CourseSchema);

export default CourseModel;