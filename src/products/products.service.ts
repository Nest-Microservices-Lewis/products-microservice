import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto } from '../common';
import { PrismaClient } from '@prisma/client';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('ProductsService');

  onModuleInit() {
    this.$connect();
    this.logger.log('Database connected');
  }
  create(createProductDto: CreateProductDto) {
    return this.product.create({
      data: createProductDto,
    });
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit, page } = paginationDto;
    const totalPages = Math.ceil((await this.product.count()) / limit);
    const lastPage = Math.ceil(totalPages / limit);

    return {
      data: await this.product.findMany({
        take: limit,
        skip: (page - 1) * limit,
        where: {
          available: true,
        },
      }),
      meta: {
        total: await this.product.count(),
        page,
        totalPages,
        lastPage,
      },
    };
  }

  async findOne(id: number) {
    return this.product
      .findUniqueOrThrow({ where: { id, available: true } })
      .catch(() => {
        throw new RpcException({
          message: `Product with id #${id} not found`,
          status: HttpStatus.NOT_FOUND,
        });
      });
  }

  async update({ id, ...updateProductDto }: UpdateProductDto) {
    await this.findOne(id);

    return this.product.update({ where: { id }, data: updateProductDto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.product.update({
      where: { id },
      data: {
        available: false,
      },
    });
  }

  async validateProducts(ids: number[]) {
    ids = Array.from(new Set(ids));

    const products = await this.product.findMany({
      where: { id: { in: ids } },
    });

    if (products.length !== ids.length) {
      console.log('ENTREEE');
      throw new RpcException({
        message: 'Some products where not found',
        status: HttpStatus.NOT_FOUND,
      });
    }

    return products;
  }
}
