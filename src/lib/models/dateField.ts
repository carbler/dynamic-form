import { FieldBase } from '../abstract/fieldBase';

export class DateField extends FieldBase<string> {
  override controlType = 'date';
  override type: string;
  range: boolean;
  //min: Date;
  //max: Date;

  constructor(options: any = {}) {
    super(options);
    this.type = options['type'] || '';
    this.range = options['range'] == undefined ? false : options['range'];
    this.range = options['min'] == undefined ? null : options['min'];

  }
}