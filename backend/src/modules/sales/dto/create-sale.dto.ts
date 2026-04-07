import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsNumber, IsUUID, Max, Min } from 'class-validator';

export enum CreateSalePaymentMode {
  CASH = 'cash',
  ONLINE = 'online',
}

export class CreateSaleDto {
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

  @IsEnum(CreateSalePaymentMode)
  payment_mode!: CreateSalePaymentMode;

  @IsUUID('4')
  received_by!: string;

  @IsDateString()
  timestamp!: string;
}
