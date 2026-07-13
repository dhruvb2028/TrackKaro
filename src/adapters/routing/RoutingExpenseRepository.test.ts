import { RoutingExpenseRepository } from "./RoutingExpenseRepository";
import { ExpenseRepository } from "../../ports/ExpenseRepository";
import { Expense } from "../../domain/models";

jest.mock("../real/supabaseClient", () => ({
  hasActiveSupabaseSession: jest.fn(),
}));
import { hasActiveSupabaseSession } from "../real/supabaseClient";

function fakeRepo(): ExpenseRepository {
  return {
    create: jest.fn(async (e: Expense) => e),
    update: jest.fn(async (e: Expense) => e),
    delete: jest.fn(async (_id: string, _userId: string) => {}),
    getById: jest.fn(async (_id: string, _userId: string): Promise<Expense | null> => null),
    listForUser: jest.fn(async (_userId: string): Promise<Expense[]> => []),
    listForMonth: jest.fn(async (_userId: string, _yearMonth: string): Promise<Expense[]> => []),
  };
}

const expense = {} as Expense;

describe("RoutingExpenseRepository", () => {
  afterEach(() => jest.clearAllMocks());

  it("routes to local when there is no active Supabase session (guest)", async () => {
    (hasActiveSupabaseSession as jest.Mock).mockResolvedValue(false);
    const local = fakeRepo();
    const remote = fakeRepo();
    const repo = new RoutingExpenseRepository(local, remote);

    await repo.create(expense);

    expect(local.create).toHaveBeenCalledWith(expense);
    expect(remote.create).not.toHaveBeenCalled();
  });

  it("routes to remote once a Supabase session is active", async () => {
    (hasActiveSupabaseSession as jest.Mock).mockResolvedValue(true);
    const local = fakeRepo();
    const remote = fakeRepo();
    const repo = new RoutingExpenseRepository(local, remote);

    await repo.listForUser("u1");

    expect(remote.listForUser).toHaveBeenCalledWith("u1");
    expect(local.listForUser).not.toHaveBeenCalled();
  });

  it("stays local when no remote is configured, even if asked", async () => {
    (hasActiveSupabaseSession as jest.Mock).mockResolvedValue(true);
    const local = fakeRepo();
    const repo = new RoutingExpenseRepository(local, null);

    await repo.delete("id1", "u1");

    expect(local.delete).toHaveBeenCalledWith("id1", "u1");
  });
});
