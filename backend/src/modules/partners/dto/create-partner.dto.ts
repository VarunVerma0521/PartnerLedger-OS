import { Transform, Type } from 'class-transformer';
import { IsNumber, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreatePartnerDto {
  @Transform(({ value }) => String(value).trim())
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @Type(() => Number)
  @IsNumber(
    {
      allowNaN: false,
      allowInfinity: false,
      maxDecimalPlaces: 2,
    },
    {
      message: 'ownership_percentage must be a valid number with up to 2 decimals',
    },
  )
  @Min(0.01)
  @Max(100)
  ownership_percentage!: number;
}
