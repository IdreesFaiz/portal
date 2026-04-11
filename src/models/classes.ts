import mongoose ,{Schema , Document} from "mongoose";
import {Classes} from '@/types/classes.types'

export interface ClassesDocument extends Classes, Document {}


const ClassesSchema: Schema<ClassesDocument> =  new Schema ({
    name: { type: String, required: true },
})


const ClassesModel = mongoose.models.Classes || mongoose.model<ClassesDocument>("Classes", ClassesSchema);

export default ClassesModel;