import { FieldBase } from '../abstract/fieldBase';

export class TextareaField extends FieldBase<string> {
    override controlType = 'textarea';
    override type: string;

    constructor(options: any = {}) {
        super(options);
        this.type = options['type'] || '';
    }
}