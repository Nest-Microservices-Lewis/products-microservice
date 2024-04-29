import { IsNumber } from 'class-validator';

export class FindOneDto {
  @IsNumber()
  public id: number;
}
