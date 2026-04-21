import { PartialType } from '@nestjs/mapped-types';
import { CreateCanal } from './create-canal.dto';

export class UpdateCanal extends PartialType(CreateCanal) {}
