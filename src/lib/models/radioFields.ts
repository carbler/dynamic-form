import { FieldBase } from '../abstract/fieldBase';

export class RadioField extends FieldBase<string> {
    override controlType = 'radio';
    override type: string;
    options: { key: string, text: string }[] = [];

    constructor(options: any = {}) {
        super(options);
        this.type = options['type'] || '';
        this.options = options['options'] || [];

    }
}