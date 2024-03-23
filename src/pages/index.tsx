import { TextInput } from "@mantine/core";
import Head from "next/head";
import { Controller, useForm } from "react-hook-form";
import { type z } from "zod";
import { type todoInput } from "~/server/api/routers/todos";
import { api } from "~/utils/api";

import { modals } from "@mantine/modals";

import { notifications } from "@mantine/notifications";

import { Button, Menu, Select, Text } from "@mantine/core";

import {
  MantineReactTable,
  useMantineReactTable,
  type MRT_ColumnDef,
} from "mantine-react-table";
import { useMemo } from "react";

export default function Home() {
  type Task = z.infer<typeof todoInput>;

  const { control, handleSubmit, reset } = useForm<Task>({
    mode: "onBlur",
  });

  const tasks = api.task.getAll.useQuery();
  const createTask = api.task.create.useMutation();
  const updateTask = api.task.update.useMutation();
  // eslint-disable-next-line drizzle/enforce-delete-with-where
  const deleteTask = api.task.delete.useMutation();

  const columns = useMemo<MRT_ColumnDef<Task & { createdAt: Date }>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Todo name",
      },
      {
        accessorKey: "status",
        header: "Status",
      },
      {
        header: "Created At",
        accessorFn: (originalRow) => {
          return (
            <span>
              {originalRow?.createdAt
                ? new Intl.DateTimeFormat("en-GB", {
                    dateStyle: "full",
                  }).format(originalRow.createdAt)
                : "N/A"}
            </span>
          );
        },
      },
    ],
    [],
  );

  const openModal = (id: number) => {
    const task = tasks.data?.find((td) => td.id === id);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    reset(task);

    modals.open({
      id: "edit-task",
      title: "Edit Task",
      children: <TodoForm />,
      onClose() {
        reset({
          name: "",
          status: "PENDING",
        });
      },
      // labels: { confirm: "Confirm", cancel: "Cancel" },
      // onCancel: () => console.log("Cancel"),
      // onConfirm: () => console.log("Confirmed"),
    });
  };

  const openDeleteModal = (id: number) =>
    modals.openConfirmModal({
      title: "Delete todo",
      centered: true,
      children: (
        <Text size="sm">
          Are you sure you want to delete this todo item{" "}
          <strong>{tasks.data?.find((td) => td.id === id)?.name}</strong> This
          action is destructive and cannot be undone!.
        </Text>
      ),
      labels: { confirm: "Delete Task", cancel: "No don't delete it" },
      confirmProps: { color: "red" },
      onCancel: () => console.log("Cancel"),
      onConfirm: () => deleteTaskById(id),
    });

  const table = useMantineReactTable({
    columns,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    data: tasks?.data ?? [],
    state: {
      isLoading: tasks.isLoading,
    },
    enableRowActions: true,
    renderRowActionMenuItems: ({ row }) => (
      <>
        <Menu.Item onClick={() => openModal(row.original.id!)}>
          <Button className="w-20">Edit</Button>
        </Menu.Item>
        <Menu.Item onClick={() => openDeleteModal(row.original.id!)}>
          <Button className="w-20 bg-red-500 hover:bg-red-600">Delete</Button>
        </Menu.Item>
      </>
    ),
  });

  function createOrUpdateTask(task: Task) {
    modals.closeAll();

    if (!Boolean(task.id)) {
      createTask.mutate(
        { ...task },
        {
          async onSuccess() {
            notifications.show({
              title: "Success",
              message: "Successfully created task",
            });

            await tasks.refetch();

            reset({
              name: "",
              status: "PENDING",
            });
          },
        },
      );
      return;
    }

    updateTask.mutate(
      { ...task },
      {
        async onSuccess() {
          notifications.show({
            title: "Success",
            message: "Successfully updated task",
          });

          await tasks.refetch();

          reset({
            name: "",
            status: "PENDING",
          });
        },
      },
    );
  }

  function deleteTaskById(id: number) {
    deleteTask.mutate(id, {
      async onSuccess() {
        await tasks.refetch();
        notifications.show({
          title: "Success",
          message: "Successfully deleted task",
        });
      },
    });
  }

  function TodoForm() {
    return (
      <form
        onSubmit={handleSubmit(createOrUpdateTask)}
        className="my-4 flex flex-col gap-2"
      >
        <Controller
          control={control}
          name="id"
          render={({ field }) => (
            <div className="flex flex-col ">
              <input type="hidden" {...field} />
            </div>
          )}
        />
        <Controller
          control={control}
          name="name"
          rules={{ required: "Task Name is required" }}
          render={({ field, formState: { errors } }) => (
            <div className="flex flex-col ">
              <TextInput
                label="Task Name"
                placeholder="Enter task name"
                {...field}
                error={errors?.[field?.name]?.message}
              />
            </div>
          )}
        />
        <Controller
          control={control}
          name="status"
          rules={{ required: "Status is required" }}
          // defaultValue="PENDING"
          render={({ field, formState: { errors } }) => (
            <Select
              label="Status"
              placeholder="Select Status"
              {...field}
              data={["PENDING", "IN_PROGRESS", "COMPLETED"]}
              error={errors?.[field?.name]?.message}
            />
          )}
        />
        <Button variant="filled" type="submit">
          Save
        </Button>
      </form>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-10">
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <h3 className="font-bold underline">
        TODO <span className="font-light">(s)</span> APP
      </h3>

      <TodoForm />

      <MantineReactTable table={table} />
    </div>
  );
}
