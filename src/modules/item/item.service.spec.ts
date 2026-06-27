import { Test, TestingModule } from '@nestjs/testing';

// "getModelToken" is a helper that NestJS uses internally to name its models.
// We need it so we can say "replace the real Business model with our fake one".
import { getModelToken } from '@nestjs/mongoose';
import { getQueueToken } from '@nestjs/bullmq';
import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ItemService } from './item.service';
import { Business } from '../business/schemas/buisness.schema';
import { User } from '../user/schemas/user.schema';
import { Item } from './schemas/item.schema';
import { EmbedClientService } from '../search/clients/embed-client.service';
import { EmbeddingTextBuilder } from '../search/pipeline/embedding-text.builder';

// ─────────────────────────────────────────────────────────────────────────────
// describe() — a container/folder for related tests
// The string 'ItemService' is the label shown in your terminal when tests run.
// ─────────────────────────────────────────────────────────────────────────────
describe('ItemService', () => {
  // We declare these here (outside beforeEach) so every test below can use them.
  let service: ItemService;

  // These will hold our FAKE mongoose models.
  // "any" type because we only add the methods we need — not a full Mongoose model.
  let mockBusinessModel: any;
  let mockUserModel: any;
  let mockItemModel: any;

  // ItemService also depends on the notifications queue and the search-module
  // embedding collaborators. We stub each so DI can resolve the constructor.
  let mockNotificationQueue: any;
  let mockEmbedClient: any;
  let mockEmbeddingTextBuilder: any;

  // ───────────────────────────────────────────────────────────────────────────
  // beforeEach() runs BEFORE every single "it()" test below.
  // This means each test starts fresh — no leftover state from previous tests.
  // ───────────────────────────────────────────────────────────────────────────
  beforeEach(async () => {
    // We build our fake models here.
    // jest.fn() creates a fake function that:
    //   - records if it was called
    //   - records what arguments it received
    //   - lets us define what it returns per test
    // We only add the methods that ItemService actually uses.
    mockBusinessModel = {
      findOne: jest.fn(),
    };

    mockUserModel = {
      // ItemService never uses userModel directly, but NestJS requires it to be
      // provided because the constructor declares it. So we pass an empty object.
    };

    mockItemModel = {
      create: jest.fn(),
      findOne: jest.fn(),
      findByIdAndDelete: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      insertMany: jest.fn(),
      deleteMany: jest.fn(),
    };

    mockNotificationQueue = { add: jest.fn() };
    mockEmbedClient = { createEmbedding: jest.fn() };
    mockEmbeddingTextBuilder = { buildRequestBody: jest.fn() };

    // Test.createTestingModule() builds a stripped-down NestJS module.
    // Think of it like AppModule but only with the pieces this service needs.
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        // The REAL service — this is what we are testing.
        ItemService,

        // Instead of a real MongoDB-connected Business model, inject our fake.
        // getModelToken(Business.name) produces the exact token NestJS uses
        // internally to identify this model — so the swap works perfectly.
        {
          provide: getModelToken(Business.name),
          useValue: mockBusinessModel,
        },

        // Same swap for User model.
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },

        // Same swap for Item model.
        {
          provide: getModelToken(Item.name),
          useValue: mockItemModel,
        },

        // Non-model dependencies of ItemService.
        {
          provide: getQueueToken('notifications'),
          useValue: mockNotificationQueue,
        },
        {
          provide: EmbedClientService,
          useValue: mockEmbedClient,
        },
        {
          provide: EmbeddingTextBuilder,
          useValue: mockEmbeddingTextBuilder,
        },
      ],
    }).compile(); // .compile() finalises the module — must be awaited.

    // Pull the real ItemService instance out of the module.
    // It looks real but internally uses our fake models.
    service = module.get<ItemService>(ItemService);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // SANITY CHECK
  // The simplest possible test — just confirm the service was created.
  // If this fails, something is wrong with your module setup above.
  // ───────────────────────────────────────────────────────────────────────────
  it('should be defined', () => {
    // expect() wraps a value and gives you matchers to check it.
    // toBeDefined() passes if the value is not null or undefined.
    expect(service).toBeDefined();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TESTING: addItemManual()
  // We group all tests for this method in a nested describe() for organisation.
  // ───────────────────────────────────────────────────────────────────────────
  describe('addItemManual', () => {
    it('should create an item and return the success message', async () => {
      // ── ARRANGE ────────────────────────────────────────────────────────────
      // Build the fake data our mocks will return. The business carries the
      // denormalised fields the service copies onto the new item.
      const fakeBusiness = {
        _id: 'biz-001',
        name: 'Tony Pizzeria',
        category: 'restaurant',
        type: 'fast_food',
        rate: 4.5,
        workingHours: [{ day: 'monday', from: '09:00', to: '22:00', isClosed: false }],
        location: { type: 'Point', coordinates: [31.2, 30.0] },
      };

      // addItemManual builds an embedding-text payload, then asks the embed
      // client to turn it into a vector — both are stubbed here.
      const fakeEmbeddingText = { name: 'Burger', businessName: 'Tony Pizzeria' };
      const fakeEmbedding = [0.1, 0.2, 0.3];

      // This is what the fake DB returns after creating an item.
      const fakeCreatedItem = { _id: 'item-001', name: 'Burger', price: 15 };

      mockBusinessModel.findOne.mockResolvedValue(fakeBusiness);
      mockEmbeddingTextBuilder.buildRequestBody.mockReturnValue(fakeEmbeddingText);
      mockEmbedClient.createEmbedding.mockResolvedValue(fakeEmbedding);
      mockItemModel.create.mockResolvedValue(fakeCreatedItem);

      // ── ACT ────────────────────────────────────────────────────────────────
      const result = await service.addItemManual(
        'biz-001', // businessId
        'owner-001', // ownerId
        { name: 'Burger', price: 15 } as any, // item DTO
      );

      // ── ASSERT ─────────────────────────────────────────────────────────────
      expect(result).toEqual({
        message: 'Item Added Successfully',
        item: fakeCreatedItem,
      });

      // validateBusiness() looked the business up by id + owner.
      expect(mockBusinessModel.findOne).toHaveBeenCalledWith({
        _id: 'biz-001',
        ownerId: 'owner-001',
      });

      // The embedding pipeline ran with the resolved business and item.
      expect(mockEmbeddingTextBuilder.buildRequestBody).toHaveBeenCalledWith({ name: 'Burger', price: 15 }, fakeBusiness);
      expect(mockEmbedClient.createEmbedding).toHaveBeenCalledWith(fakeEmbeddingText);

      // create() received the item spread PLUS the denormalised business fields
      // and the generated embedding.
      expect(mockItemModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Burger',
          price: 15,
          businessId: 'biz-001',
          businessName: 'Tony Pizzeria',
          businessCategory: 'restaurant',
          businessType: 'fast_food',
          businessRate: 4.5,
          workingHours: fakeBusiness.workingHours,
          location: fakeBusiness.location,
          embedding: fakeEmbedding,
        }),
      );
    });

    it('should throw UnauthorizedException when business is not found', async () => {
      // findOne returns null → means no business matched in DB
      mockBusinessModel.findOne.mockResolvedValue(null);

      // When testing that something THROWS, we wrap the call with:
      // expect( theAsyncCall ).rejects.toThrow( TheErrorClass )
      //
      // .rejects tells Jest: this promise is expected to be rejected (throw).
      // .toThrow(UnauthorizedException) checks it threw THIS specific class.
      await expect(service.addItemManual('wrong-biz', 'owner-001', {} as any)).rejects.toThrow(UnauthorizedException);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TESTING: addItemsBulk()
  // ───────────────────────────────────────────────────────────────────────────
  describe('addItemsBulk', () => {
    it('should throw BadRequestException when items array is empty', async () => {
      // This guard check happens BEFORE any DB call, so we don't even
      // need to set up mockBusinessModel here — the service throws immediately.
      await expect(service.addItemsBulk('biz-001', 'owner-001', [])).rejects.toThrow(BadRequestException);

      // Extra check: confirm no DB call was ever made.
      // toHaveBeenCalled() passes if the mock was called at least once.
      // not.toHaveBeenCalled() is the opposite — it should NOT have been called.
      expect(mockBusinessModel.findOne).not.toHaveBeenCalled();
    });

    it('should insert all items and return count + items', async () => {
      const fakeBusiness = { _id: 'biz-001' };

      // Simulate two items being inserted successfully.
      const fakeInserted = [
        { _id: 'i1', name: 'Apple', businessId: 'biz-001' },
        { _id: 'i2', name: 'Banana', businessId: 'biz-001' },
      ];

      mockBusinessModel.findOne.mockResolvedValue(fakeBusiness);
      mockItemModel.insertMany.mockResolvedValue(fakeInserted);

      const result = await service.addItemsBulk('biz-001', 'owner-001', [{ name: 'Apple' }, { name: 'Banana' }] as any);

      // toBe() checks strict equality — same as === in JavaScript.
      // Use it for numbers, strings, and booleans.
      // Do NOT use it for objects/arrays — use toEqual() for those.
      expect(result.count).toBe(2);
      expect(result.message).toBe('Items Added Successfully');

      // Check that insertMany received the items with businessId added to each.
      expect(mockItemModel.insertMany).toHaveBeenCalledWith([
        { name: 'Apple', businessId: 'biz-001' },
        { name: 'Banana', businessId: 'biz-001' },
      ]);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TESTING: deleteItem()
  // ───────────────────────────────────────────────────────────────────────────
  describe('deleteItem', () => {
    it('should delete the item and return success message', async () => {
      const fakeBusiness = { _id: 'biz-001' };
      mockBusinessModel.findOne.mockResolvedValue(fakeBusiness);

      // findByIdAndDelete doesn't need a meaningful return value here.
      // The service doesn't use what it returns — it just awaits it.
      // mockResolvedValue({}) means "resolved successfully, returned empty object".
      mockItemModel.findByIdAndDelete.mockResolvedValue({});

      const result = await service.deleteItem('owner-001', 'biz-001', 'item-001');

      // The service returns this string on success.
      expect(result).toEqual({ message: 'Item Deleted Successfully' });

      // Verify the delete was called with the correct filter object.
      expect(mockItemModel.findByIdAndDelete).toHaveBeenCalledWith({
        _id: 'item-001',
        businessId: 'biz-001',
      });
    });

    it('should throw UnauthorizedException when business not found', async () => {
      mockBusinessModel.findOne.mockResolvedValue(null);

      await expect(service.deleteItem('owner-001', 'wrong-biz', 'item-001')).rejects.toThrow(UnauthorizedException);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TESTING: getItem()
  // ───────────────────────────────────────────────────────────────────────────
  describe('getItem', () => {
    it('should return the item when found', async () => {
      const fakeBusiness = { _id: 'biz-001' };
      const fakeItem = { _id: 'item-001', name: 'Pizza', price: 20 };

      mockBusinessModel.findOne.mockResolvedValue(fakeBusiness);
      mockItemModel.findOne.mockResolvedValue(fakeItem);

      const result = await service.getItem('owner-001', 'biz-001', 'item-001');

      // The service returns the item directly — so result should equal fakeItem.
      expect(result).toEqual(fakeItem);
    });

    it('should throw NotFoundException when item does not exist', async () => {
      mockBusinessModel.findOne.mockResolvedValue({ _id: 'biz-001' });

      // null here means "no item found in DB for this query"
      mockItemModel.findOne.mockResolvedValue(null);

      await expect(service.getItem('owner-001', 'biz-001', 'ghost-item')).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException when business not found', async () => {
      mockBusinessModel.findOne.mockResolvedValue(null);

      await expect(service.getItem('owner-001', 'bad-biz', 'item-001')).rejects.toThrow(UnauthorizedException);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TESTING: updateItem()
  // ───────────────────────────────────────────────────────────────────────────
  describe('updateItem', () => {
    it('should update the item and return the updated version', async () => {
      const fakeBusiness = { _id: 'biz-001' };

      // This is the item BEFORE updating — findOne returns it.
      const existingItem = { _id: 'item-001', name: 'Old Name' };

      // This is what findByIdAndUpdate returns — the item AFTER the update.
      const updatedItem = { _id: 'item-001', name: 'New Name' };

      mockBusinessModel.findOne.mockResolvedValue(fakeBusiness);
      mockItemModel.findOne.mockResolvedValue(existingItem);
      mockItemModel.findByIdAndUpdate.mockResolvedValue(updatedItem);

      const result = await service.updateItem('owner-001', 'biz-001', 'item-001', { name: 'New Name' } as any);

      expect(result).toEqual(updatedItem);

      // Verify the update was called with Mongoose's $set operator.
      // { new: true } means "return the updated doc, not the old one".
      // { strict: false } means "allow fields not in the schema".
      expect(mockItemModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'item-001', // the item's _id
        { $set: { name: 'New Name' } }, // the update operation
        { new: true, strict: false }, // the options
      );
    });

    it('should throw NotFoundException when item does not exist', async () => {
      mockBusinessModel.findOne.mockResolvedValue({ _id: 'biz-001' });

      // findOne returns null → item not found → service should throw
      mockItemModel.findOne.mockResolvedValue(null);

      await expect(service.updateItem('owner-001', 'biz-001', 'ghost', {} as any)).rejects.toThrow(NotFoundException);

      // findByIdAndUpdate should NEVER be reached when item doesn't exist.
      expect(mockItemModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TESTING: bulkDeleteItem()
  // ───────────────────────────────────────────────────────────────────────────
  describe('bulkDeleteItem', () => {
    it('should delete multiple items and return success message', async () => {
      const fakeBusiness = { _id: 'biz-001' };
      mockBusinessModel.findOne.mockResolvedValue(fakeBusiness);
      mockItemModel.deleteMany.mockResolvedValue({});

      const result = await service.bulkDeleteItem(
        'owner-001',
        'biz-001',
        'unused-param', // ← notice: the service receives itemId but never uses it
        ['item-1', 'item-2', 'item-3'],
      );

      expect(result).toEqual({ message: 'Items Deleted Successfully' });

      // Verify deleteMany used the $in operator to delete all IDs at once.
      expect(mockItemModel.deleteMany).toHaveBeenCalledWith({
        businessId: 'biz-001',
        _id: { $in: ['item-1', 'item-2', 'item-3'] },
      });
    });

    it('should throw UnauthorizedException when business not found', async () => {
      mockBusinessModel.findOne.mockResolvedValue(null);

      await expect(service.bulkDeleteItem('owner-001', 'bad-biz', '', ['item-1'])).rejects.toThrow(UnauthorizedException);
    });
  });
});
