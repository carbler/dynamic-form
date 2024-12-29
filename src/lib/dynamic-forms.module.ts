import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicFieldComponent } from './compoments/dynamic-field/dynamic-field.component';
import { DynamicFormComponent } from './compoments/dynamic-form/dynamic-form.component';
import { InputComponent } from './compoments/fields/input/input.component';

@NgModule({
  declarations: [DynamicFieldComponent, DynamicFormComponent, InputComponent],
  imports: [CommonModule],
  exports: [DynamicFormComponent],
})
export class DynamicFormsModule {}
