import { FieldBase } from '../abstract/fieldBase';

export class FileField extends FieldBase<string> {
    override controlType = 'file';
    override type: string;
    textButton: string;

    constructor(options: any = {}) {
        super(options);
        this.type = options['type'] || '';
        this.textButton = options['textButton'] || '';
    }
}