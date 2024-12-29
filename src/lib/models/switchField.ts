import { FieldBase } from '../abstract/fieldBase';


export class SwitchField extends FieldBase<string> {
	override controlType = 'switch';
	override type: string;

	constructor(options: any = {}) {
		super(options);
		this.type = options['type'] || '';
	}
}