import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto } from '../common';
import { PrismaClient } from '@prisma/client';

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
        throw new NotFoundException(`Product with id #${id} not found`);
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
}
