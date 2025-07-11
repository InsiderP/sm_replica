import { Module, DynamicModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmProvider } from './typeorm.provider';

@Module({})
export class TypeOrmProviderModule {
  static forRootAsync(): DynamicModule {
    return {
      module: TypeOrmProviderModule,
      imports: [
        ConfigModule,
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: typeOrmProvider.useFactory,
          inject: typeOrmProvider.inject,
        }),
      ],
      exports: [TypeOrmModule],
    };
  }
} 