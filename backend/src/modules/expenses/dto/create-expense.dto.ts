import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export enum CreateExpenseType {
  BUSINESS = 'business',
  PERSONAL = 'personal',
}

export enum CreateExpensePaymentSource {
  CASH = 'cash',
  ONLINE = 'online',
}

export class CreateExpenseDto {
  @Type(() => Number)
  @IsNumber(
    {
      allowNaN: false,
      allowInfinity: false,
      maxDecimalPlaces: 2,
    },
    {
      message: 'amount must be a valid number with up to 2 decimals',
    },
  )
  @Min(0.01)
  @Max(999999999999.99)
  amount!: number;

  @Transform(({ value }) => String(value).trim())
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  category!: string;

  @IsUUID('4')
  paid_by!: string;

  @IsEnum(CreateExpenseType)
  type!: CreateExpenseType;

  @IsEnum(CreateExpensePaymentSource)
  payment_source!: CreateExpensePaymentSource;

  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === null ? undefined : String(value).trim(),
  )
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  description?: string;

  @IsDateString()
  timestamp!: string;
}
